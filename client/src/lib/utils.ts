export { cn } from "cn";
export { formatBRL, parseBRLToCents } from "./money";

export const discountPercent = (price: number, compareAtPrice: number | null) =>
  compareAtPrice && compareAtPrice > price
    ? Math.round((1 - price / compareAtPrice) * 100)
    : 0;

export const SIZE_OPTIONS = ["PP", "P", "M", "G", "GG", "XG", "Único", "2", "4", "6", "8", "10", "12"];
