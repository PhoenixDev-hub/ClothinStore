import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, Layers3, Package, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { fetchAllAdminProducts } from '@/lib/admin-products';
import { catalogStats } from '@/lib/catalog';
import { api } from '@/lib/api';
import type { Category } from '@/types/api';

export default function DashboardPage() {
  const productsQuery = useQuery({
    queryKey: ['admin-products', 'all'],
    queryFn: fetchAllAdminProducts,
  });
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<Category[]>('/categories')).data,
  });

  const isLoading = productsQuery.isPending || categoriesQuery.isPending;
  const hasError = productsQuery.isError || categoriesQuery.isError;

  if (isLoading) {
    return (
      <div className="grid gap-6" role="status" aria-label="Carregando dashboard">
        <div className="h-10 w-56 animate-pulse rounded-md bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <section className="grid min-h-56 place-items-center rounded-xl border border-border bg-white px-6 text-center">
        <div>
          <p className="font-semibold">Não foi possível carregar o dashboard.</p>
          <p className="mt-1 text-sm text-muted-foreground">Confira a conexão com a API e tente novamente.</p>
          <button
            type="button"
            className="mt-4 text-sm font-semibold text-wine underline"
            onClick={() => {
              void productsQuery.refetch();
              void categoriesQuery.refetch();
            }}
          >
            Tentar novamente
          </button>
        </div>
      </section>
    );
  }

  const stats = catalogStats(productsQuery.data);
  const categoryCount = categoriesQuery.data.length;

  const cards = [
    { label: 'Produtos', value: stats.total, icon: Package, tone: 'bg-accent text-accent-foreground' },
    { label: 'Categorias', value: categoryCount, icon: Layers3, tone: 'bg-muted text-muted-foreground' },
    { label: 'Esgotados', value: stats.outOfStock, icon: AlertTriangle, tone: 'bg-red-50 text-destructive' },
    { label: 'Estoque baixo', value: stats.lowStock, icon: TrendingDown, tone: 'bg-amber-soft text-amber-ink' },
  ];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Um resumo rápido do catálogo e do estoque.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="flex items-center gap-4 p-5">
            <span className={`grid size-11 shrink-0 place-items-center rounded-lg ${tone}`}>
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="font-display text-3xl font-semibold tabular-nums">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="text-lg font-semibold">Atalhos</h2>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link to="/produtos" className="inline-flex items-center gap-1 font-semibold text-wine no-underline hover:underline">
            Ver produtos <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <Link to="/categorias" className="inline-flex items-center gap-1 font-semibold text-wine no-underline hover:underline">
            Ver categorias <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <Link to="/produtos/importar" className="inline-flex items-center gap-1 font-semibold text-wine no-underline hover:underline">
            Importar CSV <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </Card>
    </div>
  );
}
