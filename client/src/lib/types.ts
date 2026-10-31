export type Category = "feminino" | "fitness" | "acessorios" | "infantil";

export interface ColorOption {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  category: Category;
  sizes: string[];
  colors: ColorOption[];
  stock: number;
  is_new: boolean;
  is_bestseller: boolean;
  is_demo?: boolean;
  created_at: string;
}

export interface ProductCreate {
  name: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  category: Category;
  sizes: string[];
  colors: ColorOption[];
  stock: number;
  is_new: boolean;
  is_bestseller: boolean;
  images: string[];
}

export interface ProductFacets {
  sizes: string[];
  colors: ColorOption[];
  min_price: number;
  max_price: number;
}

export interface StoreSettings {
  whatsapp_number: string;
}

export interface AdminStatus {
  authenticated: boolean;
}

export interface AdminStats {
  total_products: number;
  demo_products: number;
  low_stock: number;
  out_of_stock: number;
}

export interface DemoActionResult {
  deleted?: number;
  inserted?: number;
}

export interface ImageUploadResult {
  url: string;
}

export interface CepResult {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}
