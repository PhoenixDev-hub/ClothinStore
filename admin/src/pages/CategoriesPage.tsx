import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CirclePlus, Link2, Pencil, Search, Trash2, Upload, X } from 'lucide-react';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { api, apiErrorMessage } from '@/lib/api';
import { paginate } from '@/lib/catalog';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/api';

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  image: string;
  position: string;
  isActive: boolean;
  parentId: string;
}

const emptyForm: CategoryForm = {
  name: '',
  slug: '',
  description: '',
  image: '',
  position: '0',
  isActive: true,
  parentId: '',
};

const PAGE_SIZE = 20;

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [formError, setFormError] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const query = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<Category[]>('/categories')).data,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      slug: string;
      description?: string;
      image?: string;
      position: number;
      isActive: boolean;
      parentId: number | null;
    }) => {
      if (editingId) return api.put(`/categories/${editingId}`, payload);
      return api.post('/categories', payload);
    },
    onSuccess: async () => {
      toast.success(editingId ? 'Categoria atualizada.' : 'Categoria criada.');
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      setSlugEdited(false);
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      const message = apiErrorMessage(error);
      setFormError(message);
      toast.error(message);
    },
  });

  async function removeCategory(category: Category) {
    setDeleting(true);
    try {
      await api.delete(`/categories/${category.id}`);
      toast.success('Categoria excluída.');
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      setPendingDelete(null);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  function startEditing(category: Category) {
    setEditingId(category.id);
    setShowForm(true);
    setSlugEdited(true);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      image: category.image ?? '',
      position: String(category.position),
      isActive: category.isActive,
      parentId: category.parentId === null ? '' : String(category.parentId),
    });
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
    if (file.size > 5 * 1024 * 1024) {
      setFormError('A imagem deve ter no máximo 5 MB.');
      return;
    }

    const body = new FormData();
    body.append('file', file);
    setUploading(true);
    setFormError('');
    try {
      const response = await api.post<{ url: string }>('/admin/categories/upload', body);
      update('image', response.data.url);
      toast.success('Imagem enviada.');
    } catch (error) {
      setFormError(apiErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  function cancelForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setSlugEdited(false);
    setShowUrlInput(false);
    setFormError('');
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    if (!form.name.trim() || !form.slug.trim()) {
      setFormError('Informe o nome e o slug da categoria.');
      return;
    }
    const position = Number(form.position);
    if (!Number.isInteger(position) || position < 0) {
      setFormError('A posição deve ser um número inteiro igual ou maior que zero.');
      return;
    }
    if (form.image.trim()) {
      try {
        new URL(form.image.trim());
      } catch {
        setFormError('Informe uma URL válida para a imagem.');
        return;
      }
    }

    saveMutation.mutate({
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || undefined,
      image: form.image.trim() || undefined,
      position,
      isActive: form.isActive,
      parentId: form.parentId ? Number(form.parentId) : null,
    });
  }

  function update<K extends keyof CategoryForm>(key: K, value: CategoryForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const categories = query.data ?? [];
  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
  const filteredCategories = normalizedSearch
    ? categories.filter((category) => category.name.toLocaleLowerCase('pt-BR').includes(normalizedSearch))
    : categories;
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageCategories = paginate(filteredCategories, currentPage, PAGE_SIZE);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold">Categorias</h1>
          <p className="mt-1 text-sm text-muted-foreground">Organize os produtos e a navegação do catálogo.</p>
        </div>
        {!showForm && (
          <Button className="w-full sm:w-auto" onClick={() => { setShowForm(true); setFormError(''); }}>
            <CirclePlus aria-hidden="true" className="size-4" /> Nova categoria
          </Button>
        )}
      </div>

      <section className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <label className="field-label w-full sm:max-w-sm" htmlFor="category-search">
          Buscar categoria
          <span className="relative block">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="category-search"
              type="search"
              className="pl-9"
              placeholder="Nome da categoria"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </span>
        </label>
        {query.data && (
          <p className="text-sm text-muted-foreground sm:pb-2">
            {filteredCategories.length} {filteredCategories.length === 1 ? 'categoria' : 'categorias'}
          </p>
        )}
      </section>

      {showForm && (
        <form onSubmit={submit} className="overflow-hidden rounded-xl border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold">{editingId ? 'Editar categoria' : 'Nova categoria'}</h2>
            <Button type="button" variant="ghost" size="icon" onClick={cancelForm} aria-label="Fechar formulário">
              <X aria-hidden="true" className="size-4" />
            </Button>
          </div>
          <div className="form-section">
            <div className="form-grid">
              <label className="field-label" htmlFor="category-name">
                Nome
                <Input
                  id="category-name"
                  value={form.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    setForm((current) => ({ ...current, name, ...(!slugEdited ? { slug: slugify(name) } : {}) }));
                  }}
                  required
                />
              </label>
              <label className="field-label" htmlFor="category-slug">
                Slug
                <Input id="category-slug" value={form.slug} onChange={(event) => { setSlugEdited(true); update('slug', event.target.value); }} required />
              </label>
              <div className="grid gap-2 sm:col-span-2">
                <span className="field-label">
                  Imagem <span className="font-normal text-muted-foreground">(opcional)</span>
                </span>
                {form.image ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
                    <img
                      src={form.image}
                      alt="Imagem da categoria"
                      className="size-20 shrink-0 rounded-lg border border-border object-cover"
                    />
                    <div className="flex flex-1 flex-wrap gap-2">
                      <label className={cn(buttonVariants({ variant: 'secondary' }), 'relative cursor-pointer')}>
                        <Upload aria-hidden="true" className="size-4" />
                        {uploading ? 'Enviando…' : 'Trocar imagem'}
                        <input
                          type="file"
                          className="sr-only"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={uploadImage}
                          disabled={uploading}
                          aria-label="Escolher imagem"
                        />
                      </label>
                      <Button type="button" variant="danger" onClick={() => update('image', '')}>
                        <Trash2 aria-hidden="true" className="size-4" /> Remover
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <label className={cn(buttonVariants({ variant: 'secondary' }), 'relative cursor-pointer')}>
                      <Upload aria-hidden="true" className="size-4" />
                      {uploading ? 'Enviando…' : 'Escolher imagem'}
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={uploadImage}
                        disabled={uploading}
                        aria-label="Escolher imagem"
                      />
                    </label>
                    <Button type="button" variant="ghost" onClick={() => setShowUrlInput((value) => !value)}>
                      <Link2 aria-hidden="true" className="size-4" /> Colar URL manualmente
                    </Button>
                  </div>
                )}
                {showUrlInput && (
                  <label className="field-label" htmlFor="category-image">
                    URL da imagem
                    <Input
                      id="category-image"
                      type="url"
                      value={form.image}
                      onChange={(event) => update('image', event.target.value)}
                      placeholder="https://…"
                    />
                  </label>
                )}
                <p className="text-xs text-muted-foreground">JPG, PNG ou WebP, até 5 MB.</p>
              </div>
              <label className="field-label" htmlFor="category-parent">
                Categoria pai
                <Select id="category-parent" value={form.parentId} onChange={(event) => update('parentId', event.target.value)}>
                  <option value="">Sem categoria pai</option>
                  {categories.filter((category) => category.id !== editingId).map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </Select>
              </label>
              <label className="field-label" htmlFor="category-position">
                Posição
                <Input id="category-position" type="number" min="0" step="1" value={form.position} onChange={(event) => update('position', event.target.value)} />
              </label>
              <label className="flex min-h-10 items-center gap-2 self-end pb-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(event) => update('isActive', event.target.checked)} className="size-4 accent-wine" />
                Categoria ativa
              </label>
            </div>
            <label className="field-label" htmlFor="category-description">
              Descrição <span className="font-normal text-muted-foreground">(opcional)</span>
              <textarea id="category-description" className="min-h-20 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine" value={form.description} onChange={(event) => update('description', event.target.value)} />
            </label>
            {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-destructive">{formError}</p>}
          </div>
          <footer className="flex flex-col-reverse justify-end gap-2 border-t border-border bg-[#fcfcfc] p-4 sm:flex-row sm:px-5">
            <Button type="button" variant="secondary" onClick={cancelForm}>Cancelar</Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando…' : editingId ? 'Salvar categoria' : 'Criar categoria'}
            </Button>
          </footer>
        </form>
      )}

      <section className="overflow-hidden rounded-xl border border-border bg-white" aria-busy={query.isPending}>
        {query.isPending ? (
          <div className="grid gap-3 p-5" role="status" aria-label="Carregando categorias">
            {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-12 animate-pulse rounded-md bg-muted" />)}
          </div>
        ) : query.isError ? (
          <div className="grid min-h-56 place-items-center px-6 text-center">
            <div>
              <p className="font-semibold">Não foi possível carregar as categorias.</p>
              <Button className="mt-4" variant="secondary" onClick={() => void query.refetch()}>Tentar novamente</Button>
            </div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="grid min-h-56 place-items-center px-6 text-center">
            <div>
              <p className="font-semibold">{categories.length === 0 ? 'Nenhuma categoria cadastrada.' : 'Nenhuma categoria encontrada.'}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {categories.length === 0 ? 'Crie categorias para organizar os produtos da loja.' : 'Tente outro nome na busca.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table min-w-[680px]">
              <caption className="sr-only">Categorias cadastradas</caption>
              <thead>
                <tr>
                  <th scope="col">Categoria</th>
                  <th scope="col">Produtos</th>
                  <th scope="col">Posição</th>
                  <th scope="col">Status</th>
                  <th scope="col"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {pageCategories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <p className="font-semibold">{category.name}</p>
                      <p className="text-xs text-muted-foreground">{category.slug}</p>
                    </td>
                    <td>{category._count?.products ?? 0}</td>
                    <td>{category.position}</td>
                    <td><Badge variant={category.isActive ? 'active' : 'archived'}>{category.isActive ? 'Ativa' : 'Inativa'}</Badge></td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label={`Editar ${category.name}`} title="Editar categoria" onClick={() => startEditing(category)}>
                          <Pencil aria-hidden="true" className="size-4" />
                        </Button>
                        <Button variant="danger" size="icon" aria-label={`Excluir ${category.name}`} title="Excluir categoria" disabled={deleting} onClick={() => setPendingDelete(category)}>
                          <Trash2 aria-hidden="true" className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!query.isPending && !query.isError && filteredCategories.length > PAGE_SIZE && (
        <nav aria-label="Paginação de categorias" className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={currentPage <= 1} onClick={() => setPage((value) => value - 1)}>
              <ArrowLeft aria-hidden="true" className="size-4" /> Anterior
            </Button>
            <Button variant="secondary" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((value) => value + 1)}>
              Próxima <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </nav>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Excluir categoria?"
        description={pendingDelete ? `Excluir a categoria “${pendingDelete.name}”? Esta ação não pode ser desfeita.` : undefined}
        confirmLabel="Excluir"
        tone="danger"
        pending={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) void removeCategory(pendingDelete);
        }}
      />
    </div>
  );
}
