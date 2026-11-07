import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clipboard, ImagePlus, Plus, Trash2, Upload } from 'lucide-react';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { api, apiErrorMessage } from '@/lib/api';
import { formatCentsInput } from '@/lib/money';
import {
  colorNameToHex,
  hexToColorName,
  serializeProductForm,
  type ProductFormValue,
  type ProductPayload,
  type VariantFormValue,
} from '@/lib/product-form';
import { cn } from '@/lib/utils';
import type { Category, Product } from '@/types/api';

function blankForm(): ProductFormValue {
  return {
    name: '',
    slug: '',
    description: '',
    price: '',
    categoryId: '',
    status: 'DRAFT',
    images: [],
    variants: [],
  };
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function toFormValue(product: Product): ProductFormValue {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: formatCentsInput(product.price),
    categoryId: String(product.categoryId),
    status: product.status,
    images: product.images,
    variants: product.variants.map((variant) => ({
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      colorHex: variant.colorHex ?? '',
      stock: String(variant.stock),
      available: variant.available,
    })),
  };
}

export default function ProductEditorPage() {
  const { id } = useParams();
  const isEditing = id !== undefined;
  const productId = isEditing ? Number(id) : undefined;
  const validProductId = productId !== undefined && Number.isSafeInteger(productId) && productId > 0;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProductFormValue>(blankForm);
  const [slugEdited, setSlugEdited] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pendingArchive, setPendingArchive] = useState<ProductPayload | null>(null);

  const productQuery = useQuery({
    queryKey: ['admin-product', productId],
    queryFn: async () => (await api.get<Product>(`/admin/products/${productId}`)).data,
    enabled: validProductId,
  });
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<Category[]>('/categories')).data,
  });

  useEffect(() => {
    if (productQuery.data) setForm(toFormValue(productQuery.data));
  }, [productQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: ProductPayload) => {
      if (validProductId) {
        return (await api.put<Product>(`/products/${productId}`, payload)).data;
      }
      return (await api.post<Product>('/products', payload)).data;
    },
    onSuccess: async (product) => {
      toast.success(isEditing ? 'Produto atualizado.' : 'Produto criado.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-product', productId] }),
      ]);
      if (!isEditing) navigate(`/produtos/${product.id}/editar`, { replace: true });
    },
    onError: (error) => {
      const message = apiErrorMessage(error);
      setFormError(message);
      toast.error(message);
    },
  });

  function update<K extends keyof ProductFormValue>(key: K, value: ProductFormValue[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateVariant(index: number, value: Partial<VariantFormValue>) {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, row) =>
        row === index ? { ...variant, ...value } : variant,
      ),
    }));
  }

  function addImage() {
    const next = imageUrl.trim();
    if (!next) return;
    try {
      new URL(next);
    } catch {
      setFormError('Informe uma URL válida para a imagem.');
      return;
    }
    update('images', [...form.images, next]);
    setImageUrl('');
    setFormError('');
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFormError('Use uma imagem JPG, PNG ou WebP.');
      return;
    }

    const body = new FormData();
    body.append('file', file);
    setUploading(true);
    setFormError('');
    try {
      const response = await api.post<{ url: string }>('/upload', body);
      update('images', [...form.images, response.data.url]);
      toast.success('Imagem enviada e adicionada ao produto.');
    } catch (error) {
      setFormError(apiErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  async function copyImageUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URL copiada.');
    } catch {
      toast.error('Não foi possível copiar a URL neste navegador.');
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    let payload: ProductPayload;
    try {
      payload = serializeProductForm(form);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Confira os dados do produto.');
      return;
    }
    if (
      productQuery.data &&
      productQuery.data.status !== 'ARCHIVED' &&
      form.status === 'ARCHIVED'
    ) {
      setPendingArchive(payload);
      return;
    }
    saveMutation.mutate(payload);
  }

  if (isEditing && !validProductId) {
    return (
      <section className="grid min-h-60 place-items-center rounded-xl border border-border bg-white p-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">ID de produto inválido.</h1>
          <Link to="/produtos" className={cn(buttonVariants({ variant: 'secondary' }), 'mt-4')}>Voltar para produtos</Link>
        </div>
      </section>
    );
  }
  if (isEditing && productQuery.isPending) {
    return <div className="h-80 animate-pulse rounded-xl bg-white" role="status" aria-label="Carregando produto" />;
  }
  if (isEditing && productQuery.isError) {
    return (
      <section className="grid min-h-60 place-items-center rounded-xl border border-border bg-white p-6 text-center">
        <div>
          <p className="font-semibold">Não foi possível carregar este produto.</p>
          <p className="mt-1 text-sm text-muted-foreground">Confira se ele ainda existe e tente novamente.</p>
          <Button className="mt-4" variant="secondary" onClick={() => void productQuery.refetch()}>
            Tentar novamente
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div>
        <Link to="/produtos" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground no-underline hover:text-wine">
          <ArrowLeft aria-hidden="true" className="size-4" /> Voltar para produtos
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold">{isEditing ? 'Editar produto' : 'Novo produto'}</h1>
          {productQuery.data && (
            <Badge variant={productQuery.data.status === 'ACTIVE' ? 'active' : productQuery.data.status === 'ARCHIVED' ? 'archived' : 'draft'}>
              {productQuery.data.status === 'ACTIVE' ? 'Ativo' : productQuery.data.status === 'ARCHIVED' ? 'Arquivado' : 'Rascunho'}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Preencha os dados que aparecem no catálogo da loja.</p>
      </div>

      {categoriesQuery.isError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-destructive">
          Não foi possível carregar as categorias. Atualize a página ou tente novamente.
        </p>
      )}

      <form onSubmit={submit} className="overflow-hidden rounded-xl border border-border bg-white">
        <section className="form-section">
          <h2 className="text-lg font-semibold">Informações do produto</h2>
          <div className="form-grid">
            <label className="field-label" htmlFor="product-name">
              Nome
              <Input
                id="product-name"
                value={form.name}
                onChange={(event) => {
                  const name = event.target.value;
                  setForm((current) => ({
                    ...current,
                    name,
                    ...(!slugEdited ? { slug: slugify(name) } : {}),
                  }));
                }}
                required
              />
            </label>
            <label className="field-label" htmlFor="product-slug">
              Slug
              <Input
                id="product-slug"
                value={form.slug}
                onChange={(event) => {
                  setSlugEdited(true);
                  update('slug', event.target.value);
                }}
                required
              />
            </label>
            <label className="field-label" htmlFor="product-price">
              Preço (R$)
              <Input
                id="product-price"
                inputMode="decimal"
                placeholder="0,00"
                value={form.price}
                onChange={(event) => update('price', event.target.value)}
                required
              />
            </label>
            <label className="field-label" htmlFor="product-category">
              Categoria
              <Select
                id="product-category"
                value={form.categoryId}
                onChange={(event) => update('categoryId', event.target.value)}
                disabled={categoriesQuery.isPending || categoriesQuery.isError}
                required
              >
                <option value="">{categoriesQuery.isPending ? 'Carregando…' : 'Selecione uma categoria'}</option>
                {(categoriesQuery.data ?? []).filter((category) => category.isActive).map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </Select>
            </label>
            <label className="field-label" htmlFor="product-status">
              Status
              <Select
                id="product-status"
                value={form.status}
                onChange={(event) => update('status', event.target.value as ProductFormValue['status'])}
              >
                <option value="DRAFT">Rascunho</option>
                <option value="ACTIVE">Ativo</option>
                <option value="ARCHIVED">Arquivado</option>
              </Select>
            </label>
          </div>
          <label className="field-label" htmlFor="product-description">
            Descrição
            <textarea
              id="product-description"
              className="min-h-28 w-full resize-y rounded-lg border border-input bg-white px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine"
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
              required
            />
          </label>
        </section>

        <section className="form-section">
          <div>
            <h2 className="text-lg font-semibold">Imagens</h2>
            <p className="mt-1 text-sm text-muted-foreground">Envie uma imagem ou adicione uma URL pública ao produto.</p>
          </div>
          <div className="form-grid items-end">
            <label className="field-label" htmlFor="image-url">
              URL da imagem
              <Input id="image-url" type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://…" />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={addImage}>
                <ImagePlus aria-hidden="true" className="size-4" /> Adicionar URL
              </Button>
              <label className={cn(buttonVariants({ variant: 'secondary' }), 'relative cursor-pointer')}>
                <Upload aria-hidden="true" className="size-4" />
                {uploading ? 'Enviando…' : 'Enviar imagem'}
                <input
                  type="file"
                  className="sr-only"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={uploadImage}
                  disabled={uploading}
                  aria-label="Enviar imagem JPG, PNG ou WebP"
                />
              </label>
            </div>
          </div>
          {form.images.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {form.images.map((url, index) => (
                <li key={`${url}-${index}`} className="flex min-w-0 items-center gap-3 rounded-lg border border-border p-2">
                  <img src={url} alt={`Imagem ${index + 1} de ${form.name || 'produto'}`} className="size-14 shrink-0 rounded-md object-cover" />
                  <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{url}</span>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Copiar URL da imagem ${index + 1}`} title="Copiar URL" onClick={() => void copyImageUrl(url)}>
                    <Clipboard aria-hidden="true" className="size-4" />
                  </Button>
                  <Button type="button" variant="danger" size="icon" aria-label={`Remover imagem ${index + 1}`} title="Remover imagem" onClick={() => update('images', form.images.filter((_, row) => row !== index))}>
                    <Trash2 aria-hidden="true" className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg bg-muted px-4 py-5 text-sm text-muted-foreground">Adicione pelo menos uma imagem antes de salvar.</p>
          )}
        </section>

        <section className="form-section">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Variantes e estoque</h2>
              <p className="mt-1 text-sm text-muted-foreground">Cada combinação de tamanho e cor gera um SKU automaticamente quando o campo fica vazio.</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => update('variants', [...form.variants, { sku: '', size: '', color: 'Preto', colorHex: '#111111', stock: '0', available: true }])}
            >
              <Plus aria-hidden="true" className="size-4" /> Adicionar variante
            </Button>
          </div>
          {form.variants.length === 0 ? (
            <p className="rounded-lg bg-muted px-4 py-5 text-sm text-muted-foreground">Este produto ainda não tem variantes.</p>
          ) : (
            <div className="grid gap-3">
              {form.variants.map((variant, index) => (
                <fieldset key={index} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1.1fr_0.7fr_0.9fr_0.7fr_auto_auto] sm:items-end">
                  <legend className="sr-only">Variante {index + 1}</legend>
                  <label className="field-label">
                    SKU
                    <Input value={variant.sku} placeholder="Automático" onChange={(event) => updateVariant(index, { sku: event.target.value })} />
                  </label>
                  <label className="field-label">
                    Tamanho
                    <Input value={variant.size} onChange={(event) => updateVariant(index, { size: event.target.value })} required />
                  </label>
                  <label className="field-label" htmlFor={`variant-color-${index}`}>
                    Cor
                    <span className="flex min-h-10 items-center gap-2">
                      <input
                        id={`variant-color-${index}`}
                        type="color"
                        title="Cor exibida na loja"
                        value={variant.colorHex || colorNameToHex(variant.color) || '#111111'}
                        onChange={(event) => {
                          const colorHex = event.target.value;
                          updateVariant(index, { colorHex, color: hexToColorName(colorHex) });
                        }}
                        className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-input bg-white p-1"
                      />
                      <span className="text-sm font-normal text-muted-foreground">
                        {variant.color || 'Escolha uma cor'}
                      </span>
                    </span>
                  </label>
                  <label className="field-label">
                    Estoque
                    <Input type="number" min="0" step="1" value={variant.stock} onChange={(event) => updateVariant(index, { stock: event.target.value })} required />
                  </label>
                  <label className="flex min-h-10 items-center gap-2 text-sm">
                    <input type="checkbox" checked={variant.available} onChange={(event) => updateVariant(index, { available: event.target.checked })} className="size-4 accent-wine" />
                    Disponível
                  </label>
                  <Button type="button" variant="danger" size="icon" aria-label={`Remover variante ${index + 1}`} onClick={() => update('variants', form.variants.filter((_, row) => row !== index))}>
                    <Trash2 aria-hidden="true" className="size-4" />
                  </Button>
                </fieldset>
              ))}
            </div>
          )}
        </section>

        {formError && (
          <p role="alert" className="mx-5 mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        )}
        <footer className="flex flex-col-reverse justify-end gap-2 border-t border-border bg-[#fcfcfc] p-4 sm:flex-row sm:px-5">
          <Link to="/produtos" className={cn(buttonVariants({ variant: 'secondary' }), 'no-underline')}>Cancelar</Link>
          <Button type="submit" disabled={saveMutation.isPending || uploading || categoriesQuery.isError}>
            {saveMutation.isPending ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Criar produto'}
          </Button>
        </footer>
      </form>

      <ConfirmDialog
        open={Boolean(pendingArchive)}
        title="Arquivar produto?"
        description={productQuery.data ? `Deseja arquivar “${productQuery.data.name}”?` : undefined}
        confirmLabel="Arquivar"
        tone="danger"
        pending={saveMutation.isPending}
        onCancel={() => setPendingArchive(null)}
        onConfirm={() => {
          if (pendingArchive) saveMutation.mutate(pendingArchive);
          setPendingArchive(null);
        }}
      />
    </div>
  );
}
