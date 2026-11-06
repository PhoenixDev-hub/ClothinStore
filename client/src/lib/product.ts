import type { Product } from "@/types";

/**
 * A product is unsellable when the API says so or when no variant can be bought.
 * The product flag wins so the card and the detail page always agree.
 */
export const isSoldOut = (product: Product) =>
  !product.inStock || !product.variants.some((v) => v.available && v.stock > 0);
