import { parseBRLToCents } from './money';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface VariantFormValue {
  sku: string;
  size: string;
  color: string;
  colorHex: string;
  stock: string;
  available: boolean;
}

export interface ProductFormValue {
  name: string;
  slug: string;
  description: string;
  price: string;
  categoryId: string;
  status: ProductStatus;
  images: string[];
  variants: VariantFormValue[];
}

export interface ProductPayload
  extends Omit<ProductFormValue, 'price' | 'categoryId' | 'variants'> {
  price: number;
  categoryId: number;
  variants: {
    sku?: string;
    size: string;
    color: string;
    colorHex?: string;
    stock: number;
    available: boolean;
  }[];
}

const colorKey = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

/** Cores comuns da loja; evita o swatch cinza quando ninguém escolheu um hex. */
const COLOR_NAME_HEX: Record<string, string> = {
  preto: '#111111',
  branco: '#FFFFFF',
  cinza: '#9CA3AF',
  bege: '#E7D8C9',
  areia: '#D8C3A5',
  marrom: '#6B4F3A',
  caramelo: '#A97142',
  vermelho: '#DC2626',
  vinho: '#722F37',
  bordo: '#722F37',
  rosa: '#EC4899',
  laranja: '#F97316',
  amarelo: '#FACC15',
  mostarda: '#D4A017',
  verde: '#16A34A',
  'verde militar': '#4B5320',
  oliva: '#6B8E23',
  azul: '#2563EB',
  'azul marinho': '#1E3A8A',
  'azul claro': '#7DD3FC',
  roxo: '#7C3AED',
  lilas: '#C4B5FD',
  'off white': '#F5F5F0',
};

export function colorNameToHex(color: string): string | null {
  return COLOR_NAME_HEX[colorKey(color)] ?? null;
}

export function hexToColorName(hex: string): string {
  const value = hex.trim().toLowerCase();
  if (!value) return '';
  const match = Object.entries(COLOR_NAME_HEX).find(
    ([, colorHex]) => colorHex.toLowerCase() === value,
  );
  if (!match) return value.toUpperCase();
  return match[0].charAt(0).toUpperCase() + match[0].slice(1);
}

export function serializeProductForm(
  value: ProductFormValue,
): ProductPayload {
  const price = parseBRLToCents(value.price);
  const categoryId = Number(value.categoryId);

  if (!value.name.trim() || !value.slug.trim() || !value.description.trim()) {
    throw new Error('Preencha nome, slug e descrição do produto.');
  }
  if (price < 1) throw new Error('O preço deve ser maior que zero.');
  if (!Number.isInteger(categoryId) || categoryId < 1) {
    throw new Error('Selecione uma categoria.');
  }
  if (value.images.length === 0 || value.images.some((image) => !image.trim())) {
    throw new Error('Adicione ao menos uma imagem do produto.');
  }

  const variants = value.variants.map((variant, index) => {
    const sku = variant.sku.trim();
    const size = variant.size.trim();
    const color = variant.color.trim();
    const colorHex =
      variant.colorHex.trim() || colorNameToHex(color) || undefined;
    const stock = Number(variant.stock);

    if (!size || !color) {
      throw new Error(`Preencha tamanho e cor da variante ${index + 1}.`);
    }
    if (!Number.isInteger(stock) || stock < 0) {
      throw new Error(`Informe um estoque válido na variante ${index + 1}.`);
    }

    return {
      ...(sku ? { sku } : {}),
      size,
      color,
      ...(colorHex ? { colorHex } : {}),
      stock,
      available: variant.available,
    };
  });

  return {
    name: value.name.trim(),
    slug: value.slug.trim(),
    description: value.description.trim(),
    price,
    categoryId,
    status: value.status,
    images: value.images.map((image) => image.trim()),
    variants,
  };
}
