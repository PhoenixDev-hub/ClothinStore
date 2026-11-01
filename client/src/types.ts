export type CategorySlug = "feminino" | "fitness" | "acessorios" | "infantil";

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  category: CategorySlug;
  stock: number;
  sizes: string[];
  colors: ProductColor[];
  images: string[];
  isNew: boolean;
  isBestSeller: boolean;
  isDemo: boolean;
  createdAt: number;
}

export type ProductInput = Omit<Product, "id" | "createdAt" | "isDemo"> & { id?: string };

export type SortKey = "recent" | "name" | "price_asc" | "price_desc";

export interface ProductQuery {
  category?: CategorySlug;
  tag?: "new" | "bestseller";
  sizes?: string[];
  colors?: string[];
  min?: number;
  max?: number;
  q?: string;
  sort?: SortKey;
}

export interface CartItem {
  key: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  color?: string;
  size?: string;
  qty: number;
}
