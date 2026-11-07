import { api } from './api';
import type { Paginated, Product } from '@/types/api';

// shortcut: carrega o catálogo inteiro para filtros/estatísticas locais; migrar para parâmetros do server quando o catálogo crescer.
export async function fetchAllAdminProducts(): Promise<Product[]> {
  const limit = 100;
  const first = (
    await api.get<Paginated<Product>>('/admin/products', { params: { page: 1, limit } })
  ).data;

  if (first.meta.totalPages <= 1) return first.data;

  const remaining = await Promise.all(
    Array.from({ length: first.meta.totalPages - 1 }, (_, index) =>
      api
        .get<Paginated<Product>>('/admin/products', { params: { page: index + 2, limit } })
        .then((response) => response.data.data),
    ),
  );

  return [...first.data, ...remaining.flat()];
}
