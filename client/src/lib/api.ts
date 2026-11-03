import axios from "axios";
import { buildCartPayload } from "@/lib/cart";
import type {
  CartItem,
  CartQuote,
  Category,
  Paginated,
  Product,
  ProductQuery,
  WhatsAppOrder,
} from "@/types";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3001/api",
  headers: { "Content-Type": "application/json" },
});

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`request failed with ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error instanceof ApiError) return Promise.reject(error);
    return Promise.reject(new ApiError(error?.response?.status ?? 0, error?.response?.data ?? error?.message));
  },
);

const clean = (query: ProductQuery) =>
  Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );

export const productsApi = {
  list(query: ProductQuery = {}) {
    return api.get<Paginated<Product>>("/products", { params: clean(query) }).then((r) => r.data);
  },
  get(slug: string) {
    return api.get<Product>(`/products/${encodeURIComponent(slug)}`).then((r) => r.data);
  },
};

export const categoriesApi = {
  list() {
    return api.get<Category[]>("/categories").then((r) => r.data);
  },
};

export const cartApi = {
  quote(items: CartItem[]) {
    return api.post<CartQuote>("/cart/quote", buildCartPayload(items)).then((r) => r.data);
  },
  whatsapp(items: CartItem[]) {
    return api.post<WhatsAppOrder>("/cart/whatsapp", buildCartPayload(items)).then((r) => r.data);
  },
};

export const productQueryFromParams = (params: URLSearchParams): ProductQuery => {
  const page = Number(params.get("page"));
  const minPrice = Number(params.get("min"));
  const maxPrice = Number(params.get("max"));
  return {
    page: Number.isFinite(page) && page > 0 ? page : undefined,
    category: params.get("category") ?? undefined,
    size: params.get("size") ?? undefined,
    color: params.get("color") ?? undefined,
    search: params.get("q") ?? undefined,
    minPrice: Number.isFinite(minPrice) && params.get("min") ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) && params.get("max") ? maxPrice : undefined,
  };
};
