import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Archive, CirclePlus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { api, apiErrorMessage } from '@/lib/api';
import { formatCents } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { Paginated, Product } from '@/types/api';

const PAGE_SIZE = 10;
type StatusFilter = '' | 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

function statusLabel(status: Product['status']) {
  return {
    DRAFT: 'Rascunho',
    ACTIVE: 'Ativo',
    ARCHIVED: 'Arquivado',
  }[status];
}

function statusVariant(status: Product['status']) {
  return {
    DRAFT: 'draft',
    ACTIVE: 'active',
    ARCHIVED: 'archived',
  }[status] as 'draft' | 'active' | 'archived';
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>('');
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const query = useQuery({
    queryKey: ['admin-products', status, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
      if (status) params.status = status;
      return (
        await api.get<Paginated<Product>>('/admin/products', { params })
      ).data;
    },
  });

  async function changeStatus(product: Product, nextStatus: Product['status']) {
    const action = nextStatus === 'ARCHIVED' ? 'arquivar' : 'reativar';
    if (!window.confirm(`Deseja ${action} “${product.name}”?`)) return;

    setPendingId(product.id);
    try {
      await api.put(`/products/${product.id}`, { status: nextStatus });
      toast.success(nextStatus === 'ARCHIVED' ? 'Produto arquivado.' : 'Produto reativado.');
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setPendingId(null);
    }
  }

  async function removeProduct(product: Product) {
    if (!window.confirm(`Excluir “${product.name}” e todas as suas variantes?`)) return;

    setPendingId(product.id);
    try {
      await api.delete(`/products/${product.id}`);
      toast.success('Produto excluído.');
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setPendingId(null);
    }
  }

  const products = query.data?.data ?? [];
  const totalPages = Math.max(1, query.data?.meta.totalPages ?? 1);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold">Produtos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie o catálogo e as variantes da loja.
          </p>
        </div>
        <Link
          to="/produtos/novo"
          className={cn(buttonVariants(), 'w-full text-white no-underline sm:w-auto')}
        >
          <CirclePlus aria-hidden="true" className="size-4" /> Novo produto
        </Link>
      </div>

      <section className="grid gap-3 sm:grid-cols-[minmax(180px,260px)_1fr] sm:items-end">
        <label className="field-label" htmlFor="product-status">
          Status
          <Select
            id="product-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as StatusFilter);
              setPage(1);
            }}
          >
            <option value="">Todos os status</option>
            <option value="DRAFT">Rascunho</option>
            <option value="ACTIVE">Ativo</option>
            <option value="ARCHIVED">Arquivado</option>
          </Select>
        </label>
        {query.data && (
          <p className="text-sm text-muted-foreground sm:justify-self-end">
            {query.data.meta.total} {query.data.meta.total === 1 ? 'produto' : 'produtos'}
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-white" aria-busy={query.isPending}>
        {query.isPending ? (
          <div className="grid gap-3 p-5" role="status" aria-label="Carregando produtos">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : query.isError ? (
          <div className="grid min-h-56 place-items-center px-6 text-center">
            <div>
              <p className="font-semibold">Não foi possível carregar os produtos.</p>
              <p className="mt-1 text-sm text-muted-foreground">Confira a conexão com a API e tente novamente.</p>
              <Button className="mt-4" variant="secondary" onClick={() => void query.refetch()}>
                Tentar novamente
              </Button>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="grid min-h-56 place-items-center px-6 text-center">
            <div>
              <p className="font-semibold">Nenhum produto neste filtro.</p>
              <p className="mt-1 text-sm text-muted-foreground">Escolha outro status ou cadastre o primeiro produto.</p>
              <Link
                to="/produtos/novo"
                className={cn(buttonVariants(), 'mt-4 text-white no-underline')}
              >
                Cadastrar produto
              </Link>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table min-w-[820px]">
              <caption className="sr-only">Produtos cadastrados</caption>
              <thead>
                <tr>
                  <th scope="col">Produto</th>
                  <th scope="col">Categoria</th>
                  <th scope="col">Preço</th>
                  <th scope="col">Estoque</th>
                  <th scope="col">Status</th>
                  <th scope="col"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="flex min-w-52 items-center gap-3">
                        {product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt=""
                            className="size-12 rounded-lg border border-border object-cover"
                          />
                        ) : (
                          <span className="grid size-12 place-items-center rounded-lg bg-muted text-muted-foreground">
                            <span className="sr-only">Sem imagem</span>
                            —
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink">{product.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td>{product.category.name}</td>
                    <td className="tabular-nums">{formatCents(product.price)}</td>
                    <td className="tabular-nums">{product.totalStock}</td>
                    <td><Badge variant={statusVariant(product.status)}>{statusLabel(product.status)}</Badge></td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/produtos/${product.id}/editar`}
                          aria-label={`Editar ${product.name}`}
                          title="Editar produto"
                          className={cn(
                            buttonVariants({ variant: 'ghost', size: 'icon' }),
                            'text-ink no-underline',
                          )}
                        >
                          <Pencil aria-hidden="true" className="size-4" />
                        </Link>
                        {product.status === 'ARCHIVED' ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Reativar ${product.name}`}
                            title="Reativar produto"
                            disabled={pendingId === product.id}
                            onClick={() => void changeStatus(product, 'ACTIVE')}
                          >
                            <Archive aria-hidden="true" className="size-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Arquivar ${product.name}`}
                            title="Arquivar produto"
                            disabled={pendingId === product.id}
                            onClick={() => void changeStatus(product, 'ARCHIVED')}
                          >
                            <Archive aria-hidden="true" className="size-4" />
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="icon"
                          aria-label={`Excluir ${product.name}`}
                          title="Excluir produto"
                          disabled={pendingId === product.id}
                          onClick={() => void removeProduct(product)}
                        >
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

      {!query.isPending && !query.isError && (
        <nav aria-label="Paginação de produtos" className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
              <ArrowLeft aria-hidden="true" className="size-4" /> Anterior
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>
              Próxima <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
