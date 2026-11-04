import { describe, expect, it } from 'vitest';
import { serializeProductForm } from './product-form';

describe('serializeProductForm', () => {
  it('converts reais to centavos and serializes category and variants', () => {
    const payload = serializeProductForm({
      name: 'Camiseta',
      slug: 'camiseta',
      description: 'Algodão',
      price: '59,90',
      categoryId: '3',
      status: 'DRAFT',
      images: ['https://images.example/camiseta.jpg'],
      variants: [
        {
          sku: 'CAM-M-VINHO',
          size: 'M',
          color: 'Vinho',
          stock: '4',
          available: true,
        },
      ],
    });

    expect(payload).toMatchObject({
      price: 5990,
      categoryId: 3,
      variants: [
        {
          sku: 'CAM-M-VINHO',
          size: 'M',
          color: 'Vinho',
          stock: 4,
          available: true,
        },
      ],
    });
  });

  it('rejects incomplete variants and missing images', () => {
    const incomplete = {
      name: 'Camiseta',
      slug: 'camiseta',
      description: 'Algodão',
      price: '59,90',
      categoryId: '3',
      status: 'DRAFT' as const,
      images: [],
      variants: [],
    };

    expect(() => serializeProductForm(incomplete)).toThrow();
    expect(() =>
      serializeProductForm({
        ...incomplete,
        images: ['https://images.example/a.jpg'],
        variants: [
          { sku: '', size: 'M', color: '', stock: '0', available: true },
        ],
      }),
    ).toThrow();
  });
});
