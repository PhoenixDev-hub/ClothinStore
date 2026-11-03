export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  position: number;
  isActive: boolean;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
}

export interface Variant {
  id: number;
  sku: string;
  size: string;
  color: string;
  colorHex: string | null;
  stock: number;
  available: boolean;
  price: number | null;
  productId: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  brand: string | null;
  material: string | null;
  tags: string[];
  price: number;
  compareAtPrice: number | null;
  images: string[];
  status: ProductStatus;
  isNew: boolean;
  isFeatured: boolean;
  categoryId: number;
  category: ProductCategory;
  variants: Variant[];
  totalStock: number;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  category?: string;
  size?: string;
  color?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface CartItem {
  sku: string;
  productId: number;
  slug: string;
  name: string;
  image: string;
  unitPrice: number;
  size: string;
  color: string;
  qty: number;
  maxStock: number;
}

export interface CartPayloadItem {
  sku: string;
  quantity: number;
}

export interface CartPayload {
  items: CartPayloadItem[];
}

export type UnavailableReason =
  | "NOT_FOUND"
  | "UNAVAILABLE"
  | "OUT_OF_STOCK"
  | "INSUFFICIENT_STOCK";

export interface QuoteItem {
  sku: string;
  productName: string | null;
  variantSize: string | null;
  variantColor: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  available: boolean;
  maxStock: number;
  reason?: UnavailableReason;
}

export interface CartQuote {
  items: QuoteItem[];
  availableItems: QuoteItem[];
  unavailableItems: QuoteItem[];
  subtotal: number;
  total: number;
}

export interface WhatsAppOrder {
  message: string;
  whatsappUrl: string;
}
