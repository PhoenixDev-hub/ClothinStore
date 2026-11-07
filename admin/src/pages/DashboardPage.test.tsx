import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from './DashboardPage';
import { api } from '@/lib/api';
import type { Product } from '@/types/api';

function product(id: number, totalStock: number): Product {
  return {
    id,
    name: `Produto ${id}`,
    slug: `produto-${id}`,
    description: '',
    price: 1000,
    images: [],
    status: 'ACTIVE',
    categoryId: 1,
    category: { id: 1, name: 'Camisetas', slug: 'camisetas' },
    variants: [],
    totalStock,
    inStock: totalStock > 0,
    createdAt: '',
    updatedAt: '',
  } as Product;
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DashboardPage', () => {
  afterEach(() => cleanup());
  beforeEach(() => vi.restoreAllMocks());

  it('shows totals for products, categories and stock alerts', async () => {
    vi.spyOn(api, 'get').mockImplementation((async (url: string) => {
      if (url === '/admin/products') {
        return {
          data: {
            data: [product(1, 0), product(2, 3), product(3, 10)],
            meta: { total: 3, page: 1, limit: 100, totalPages: 1 },
          },
        };
      }
      if (url === '/categories') return { data: [{ id: 1 }, { id: 2 }] };
      throw new Error(`unexpected ${url}`);
    }) as never);

    renderPage();

    expect(await screen.findByText('Produtos')).toBeVisible();
    expect(screen.getByText('Produtos').closest('section')).toHaveTextContent('3');
    expect(screen.getByText('Categorias').closest('section')).toHaveTextContent('2');
    expect(screen.getByText('Esgotados').closest('section')).toHaveTextContent('1');
    expect(screen.getByText('Estoque baixo').closest('section')).toHaveTextContent('1');
  });
});
