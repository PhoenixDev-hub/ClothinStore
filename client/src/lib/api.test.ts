import { describe, expect, it } from "vitest";
import { api, cartApi, categoriesApi, productQueryFromParams, productsApi } from "./api";
import type { CartItem } from "@/types";

const item: CartItem = {
  sku: "CAM-BAS-M-BRANCO",
  productId: 1,
  slug: "camiseta-basica",
  name: "Camiseta Básica",
  image: "",
  unitPrice: 5990,
  size: "M",
  color: "Branco",
  qty: 2,
  maxStock: 10,
};

const mockAdapter = (data: unknown) => {
  const seen: { method?: string; url?: string; params?: unknown; body?: unknown } = {};
  api.defaults.adapter = async (config) => {
    seen.method = config.method;
    seen.url = config.url;
    seen.params = config.params;
    seen.body = config.data;
    return { data, status: 200, statusText: "OK", headers: {}, config };
  };
  return seen;
};

describe("productQueryFromParams", () => {
  it("maps URL params to the server query names and numeric values", () => {
    const params = new URLSearchParams(
      "page=2&category=camisetas&size=M&color=Preto&min=1000&max=5000&q=vestido",
    );
    expect(productQueryFromParams(params)).toEqual({
      page: 2,
      category: "camisetas",
      size: "M",
      color: "Preto",
      search: "vestido",
      minPrice: 1000,
      maxPrice: 5000,
    });
  });

  it("omits invalid and absent values", () => {
    const params = new URLSearchParams("page=0&min=abc&max=");
    expect(productQueryFromParams(params)).toEqual({
      page: undefined,
      category: undefined,
      size: undefined,
      color: undefined,
      search: undefined,
      minPrice: undefined,
      maxPrice: undefined,
    });
  });
});

describe("api endpoints", () => {
  it("lists products with server query params", async () => {
    const seen = mockAdapter({ data: [], meta: { total: 0, page: 2, limit: 12, totalPages: 0 } });
    await productsApi.list({ page: 2, category: "camisetas", minPrice: 1000 });
    expect(seen.method).toBe("get");
    expect(seen.url).toBe("/products");
    expect(seen.params).toEqual({ page: 2, category: "camisetas", minPrice: 1000 });
  });

  it("loads a product by slug", async () => {
    const seen = mockAdapter({ id: 1, slug: "camiseta-basica" });
    await productsApi.get("camiseta-basica");
    expect(seen.url).toBe("/products/camiseta-basica");
  });

  it("loads categories", async () => {
    const seen = mockAdapter([]);
    await categoriesApi.list();
    expect(seen.url).toBe("/categories");
  });

  it("quotes the cart with sku and quantity only", async () => {
    const seen = mockAdapter({ items: [], availableItems: [], unavailableItems: [], subtotal: 0, total: 0 });
    await cartApi.quote([item]);
    expect(seen.method).toBe("post");
    expect(seen.url).toBe("/cart/quote");
    expect(JSON.parse(String(seen.body))).toEqual({
      items: [{ sku: "CAM-BAS-M-BRANCO", quantity: 2 }],
    });
  });

  it("asks the server for the WhatsApp URL", async () => {
    const seen = mockAdapter({ message: "Olá", whatsappUrl: "https://wa.me/5585999999999?text=Ol%C3%A1" });
    const order = await cartApi.whatsapp([item]);
    expect(seen.url).toBe("/cart/whatsapp");
    expect(order.whatsappUrl).toContain("wa.me");
  });
});
