import { describe, expect, it } from "vitest";
import type { Product, Variant } from "@/types";
import { isSoldOut } from "./product";

const variant = (overrides: Partial<Variant> = {}): Variant => ({
  id: 1,
  sku: "VES-MID-M-AZUL",
  size: "M",
  color: "Azul",
  colorHex: "#123456",
  stock: 3,
  available: true,
  price: null,
  productId: 1,
  ...overrides,
});

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  name: "Vestido Midi",
  slug: "vestido-midi",
  description: "",
  shortDescription: null,
  brand: null,
  material: null,
  tags: [],
  price: 24990,
  compareAtPrice: null,
  images: [],
  status: "ACTIVE",
  isNew: false,
  isFeatured: false,
  categoryId: 1,
  category: { id: 1, name: "Vestidos", slug: "vestidos" },
  variants: [variant()],
  totalStock: 3,
  inStock: true,
  createdAt: "",
  updatedAt: "",
  ...overrides,
});

describe("isSoldOut", () => {
  it("is false when the product has stock", () => {
    expect(isSoldOut(product())).toBe(false);
  });

  it("is true when the product flag says out of stock", () => {
    expect(isSoldOut(product({ inStock: false, totalStock: 0 }))).toBe(true);
  });

  it("is true when every variant is unavailable", () => {
    expect(
      isSoldOut(product({ variants: [variant({ available: false, stock: 5 }), variant({ id: 2, sku: "B", stock: 0 })] })),
    ).toBe(true);
  });

  it("is false when a single variant can still be bought", () => {
    expect(
      isSoldOut(
        product({
          variants: [variant({ available: false, stock: 0 }), variant({ id: 2, sku: "B", stock: 1 })],
        }),
      ),
    ).toBe(false);
  });

  it("keeps the product flag authoritative when variants disagree", () => {
    expect(isSoldOut(product({ inStock: false, variants: [variant({ stock: 5 })] }))).toBe(true);
  });

  it("is true when the product has no variants", () => {
    expect(isSoldOut(product({ variants: [], totalStock: 0 }))).toBe(true);
  });
});
