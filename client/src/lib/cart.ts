import type { CartItem, CartPayload, UnavailableReason } from "@/types";

export const buildCartPayload = (items: CartItem[]): CartPayload => ({
  items: items.map(({ sku, qty }) => ({ sku, quantity: qty })),
});

/** Only accepts the WhatsApp link shape returned by POST /cart/whatsapp. */
export const isWhatsAppUrl = (url: string) => /^https:\/\/wa\.me\/\d+\?text=.+/i.test(url);

export const UNAVAILABLE_LABEL: Record<UnavailableReason, string> = {
  NOT_FOUND: "não encontrado",
  UNAVAILABLE: "indisponível",
  OUT_OF_STOCK: "sem estoque",
  INSUFFICIENT_STOCK: "estoque insuficiente",
};
