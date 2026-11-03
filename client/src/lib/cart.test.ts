import { describe, expect, it } from "vitest";
import type { CartItem } from "@/types";
import { buildCartPayload, isWhatsAppUrl } from "./cart";

const item = (overrides: Partial<CartItem> = {}): CartItem => ({
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
  ...overrides,
});

describe("buildCartPayload", () => {
  it("sends only sku and quantity, in cart order", () => {
    expect(buildCartPayload([item(), item({ sku: "LEG-P-PRETO", qty: 1 })])).toEqual({
      items: [
        { sku: "CAM-BAS-M-BRANCO", quantity: 2 },
        { sku: "LEG-P-PRETO", quantity: 1 },
      ],
    });
  });

  it("handles an empty cart", () => {
    expect(buildCartPayload([])).toEqual({ items: [] });
  });
});

describe("isWhatsAppUrl", () => {
  it("accepts the URL shape returned by the store", () => {
    expect(isWhatsAppUrl("https://wa.me/5585999999999?text=Ol%C3%A1%21")).toBe(true);
  });

  it("rejects other hosts, protocols and missing text", () => {
    expect(isWhatsAppUrl("https://example.com?text=oi")).toBe(false);
    expect(isWhatsAppUrl("http://wa.me/5585999999999?text=oi")).toBe(false);
    expect(isWhatsAppUrl("https://wa.me/abc?text=oi")).toBe(false);
    expect(isWhatsAppUrl("https://wa.me/5585999999999")).toBe(false);
  });
});
