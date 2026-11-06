import type { ProductStatus } from '@/lib/product-form';

export interface Variant {
  id?: number;
  sku: string;
  size: string;
  color: string;
  colorHex?: string | null;
  stock: number;
  available: boolean;
  price?: number | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  position: number;
  isActive: boolean;
  parentId: number | null;
  _count?: { products: number };
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  brand?: string | null;
  material?: string | null;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  status: ProductStatus;
  categoryId: number;
  category: Pick<Category, 'id' | 'name' | 'slug'>;
  variants: Variant[];
  totalStock: number;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminSession {
  authenticated: boolean;
}

export interface ImportReport {
  criados: number;
  erros: { linha: number; motivo: string }[];
}

