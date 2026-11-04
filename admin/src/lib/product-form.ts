import { parseBRLToCents } from './money';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface VariantFormValue {
  sku: string;
  size: string;
  color: string;
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
    sku: string;
    size: string;
    color: string;
    stock: number;
    available: boolean;
  }[];
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
    const stock = Number(variant.stock);

    if (!sku || !size || !color) {
      throw new Error(`Preencha SKU, tamanho e cor da variante ${index + 1}.`);
    }
    if (!Number.isInteger(stock) || stock < 0) {
      throw new Error(`Informe um estoque válido na variante ${index + 1}.`);
    }

    return { sku, size, color, stock, available: variant.available };
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
