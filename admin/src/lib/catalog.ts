import type { Product } from '@/types/api';
import type { ProductStatus } from './product-form';
import { stockState } from './stock';

export type ProductSort =
  | 'name-asc'
  | 'name-desc'
  | 'price-asc'
  | 'price-desc'
  | 'stock-asc'
  | 'stock-desc';

export interface ProductFilters {
  search?: string;
  status?: ProductStatus | '';
  onlyOutOfStock?: boolean;
}

export function filterProducts(products: Product[], filters: ProductFilters = {}) {
  const search = filters.search?.trim().toLocaleLowerCase('pt-BR') ?? '';

  return products.filter((product) => {
    if (search && !product.name.toLocaleLowerCase('pt-BR').includes(search)) {
      return false;
    }
    if (filters.status && product.status !== filters.status) return false;
    if (filters.onlyOutOfStock && product.totalStock > 0) return false;
    return true;
  });
}

export function sortProducts(products: Product[], sort: ProductSort) {
  const [key, direction] = sort.split('-') as [string, 'asc' | 'desc'];
  const factor = direction === 'asc' ? 1 : -1;

  return [...products].sort((a, b) => {
    if (key === 'name') {
      return factor * a.name.localeCompare(b.name, 'pt-BR');
    }
    const left = key === 'price' ? a.price : a.totalStock;
    const right = key === 'price' ? b.price : b.totalStock;
    return factor * (left - right);
  });
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  return items.slice((page - 1) * pageSize, page * pageSize);
}

export function catalogStats(products: Product[]) {
  return products.reduce(
    (stats, product) => {
      stats.total += 1;
      const state = stockState(product.totalStock);
      if (state === 'out') stats.outOfStock += 1;
      if (state === 'low') stats.lowStock += 1;
      return stats;
    },
    { total: 0, outOfStock: 0, lowStock: 0 },
  );
}
