export const normalizeSkuPart = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const variantSkuBase = (
  categorySlug: string,
  productSlug: string,
  color: string,
  size: string,
) =>
  [categorySlug, productSlug, color, size]
    .map(normalizeSkuPart)
    .join('-')
    .toUpperCase();

export async function findAvailableSku(
  base: string,
  exists: (sku: string) => Promise<boolean>,
  reserved: Set<string> = new Set(),
): Promise<string> {
  let suffix = 1;
  while (true) {
    const candidate = suffix === 1 ? base : `${base}-${suffix}`;
    if (!reserved.has(candidate) && !(await exists(candidate))) {
      reserved.add(candidate);
      return candidate;
    }
    suffix++;
  }
}
