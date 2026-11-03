const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Formats an integer amount of cents as BRL. */
export const formatBRL = (cents: number) => brl.format(cents / 100);

/** Parses a pt-BR price string ("1.234,56" or "59,90") into cents. */
export const parseBRLToCents = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const hasComma = trimmed.includes(",");
  const dotParts = trimmed.split(".");
  const dotIsDecimal = !hasComma && dotParts.length === 2 && dotParts[1].length <= 2;
  const normalized = hasComma
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : dotIsDecimal
      ? trimmed
      : trimmed.replace(/\./g, "");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.round(parsed * 100);
};
