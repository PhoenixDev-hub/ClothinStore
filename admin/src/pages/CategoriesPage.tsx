import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CirclePlus, Pencil, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { api, apiErrorMessage } from '@/lib/api';
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
  const [pendingId, setPendingId] = useState<number | null>(null);
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
    onError: (error) => setFormError(apiErrorMessage(error)),
  });

  async function removeCategory(category: Category) {
    if (!window.confirm(`Excluir a categoria “${category.name}”?`)) return;
    setPendingId(category.id);
    try {
      await api.delete(`/categories/${category.id}`);
      toast.success('Categoria excluída.');
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setPendingId(null);
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

  function cancelForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setSlugEdited(false);
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
              <label className="field-label" htmlFor="category-image">
                URL da imagem <span className="font-normal text-muted-foreground">(opcional)</span>
                <Input id="category-image" type="url" value={form.image} onChange={(event) => update('image', event.target.value)} placeholder="https://…" />
              </label>
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
        ) : categories.length === 0 ? (
          <div className="grid min-h-56 place-items-center px-6 text-center">
            <div>
              <p className="font-semibold">Nenhuma categoria cadastrada.</p>
              <p className="mt-1 text-sm text-muted-foreground">Crie categorias para organizar os produtos da loja.</p>
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
                {categories.map((category) => (
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
                        <Button variant="danger" size="icon" aria-label={`Excluir ${category.name}`} title="Excluir categoria" disabled={pendingId === category.id} onClick={() => void removeCategory(category)}>
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
    </div>
  );
}
