import { describe, expect, it } from 'vitest';
import type { Product } from '@/types/api';
import { catalogStats, filterProducts, paginate, sortProducts } from './catalog';

function product(values: Partial<Product> & Pick<Product, 'id' | 'name'>): Product {
  return {
    slug: values.name,
    description: '',
    price: 1000,
    images: [],
    status: 'ACTIVE',
    categoryId: 1,
    category: { id: 1, name: 'Camisetas', slug: 'camisetas' },
    variants: [],
    totalStock: 0,
    inStock: false,
    createdAt: '',
    updatedAt: '',
    ...values,
  } as Product;
}

const camiseta = product({ id: 1, name: 'Camiseta', price: 5000, totalStock: 0 });
const calca = product({ id: 2, name: 'Calça', price: 10000, totalStock: 3 });
const tenis = product({ id: 3, name: 'Tênis', price: 20000, totalStock: 10, status: 'DRAFT' });

describe('filterProducts', () => {
  it('filters by case-insensitive name', () => {
    expect(filterProducts([camiseta, calca, tenis], { search: 'CALÇ' })).toEqual([calca]);
  });

  it('filters by status', () => {
    expect(filterProducts([camiseta, calca, tenis], { status: 'DRAFT' })).toEqual([tenis]);
  });

  it('filters only out-of-stock products', () => {
    expect(
      filterProducts([camiseta, calca, tenis], { onlyOutOfStock: true }),
    ).toEqual([camiseta]);
  });
});

describe('sortProducts', () => {
  it('sorts by name and price', () => {
    expect(sortProducts([camiseta, tenis, calca], 'name-asc').map((item) => item.id)).toEqual([2, 1, 3]);
    expect(sortProducts([camiseta, tenis, calca], 'price-desc').map((item) => item.id)).toEqual([3, 2, 1]);
  });

  it('sorts by stock', () => {
    expect(sortProducts([tenis, camiseta, calca], 'stock-asc').map((item) => item.totalStock)).toEqual([0, 3, 10]);
  });
});

describe('paginate', () => {
  it('slices items by page and size', () => {
    expect(paginate([1, 2, 3, 4, 5], 2, 2)).toEqual([3, 4]);
  });
});

describe('catalogStats', () => {
  it('counts products, out-of-stock and low-stock items', () => {
    expect(catalogStats([camiseta, calca, tenis])).toEqual({
      total: 3,
      outOfStock: 1,
      lowStock: 1,
    });
  });
});
