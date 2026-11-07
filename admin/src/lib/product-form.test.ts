import { describe, expect, it } from 'vitest';
import { hexToColorName, serializeProductForm } from './product-form';

describe('hexToColorName', () => {
  it('maps known hex values back to a color name', () => {
    expect(hexToColorName('#722f37')).toBe('Vinho');
    expect(hexToColorName('#111111')).toBe('Preto');
  });

  it('keeps an unknown hex value as the color name', () => {
    expect(hexToColorName('#123456')).toBe('#123456');
  });
});

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
          colorHex: '#722F37',
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

  it('allows a variant without SKU and omits it from the payload', () => {
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
          sku: '',
          size: 'M',
          color: 'Vinho',
          colorHex: '',
          stock: '4',
          available: true,
        },
      ],
    });

    expect(payload.variants[0]).not.toHaveProperty('sku');
    expect(payload.variants[0]).toMatchObject({
      size: 'M',
      color: 'Vinho',
      stock: 4,
    });
  });

  it('preserves the colorHex informed by the admin', () => {
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
          sku: 'MEU-SKU',
          size: 'M',
          color: 'Vinho',
          colorHex: '#123456',
          stock: '1',
          available: true,
        },
      ],
    });

    expect(payload.variants[0]).toMatchObject({ colorHex: '#123456' });
  });

  it('derives a colorHex from the color name when none was chosen', () => {
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
          sku: '',
          size: 'M',
          color: 'Vinho',
          colorHex: '',
          stock: '1',
          available: true,
        },
      ],
    });

    expect(payload.variants[0]).toMatchObject({ colorHex: '#722F37' });
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
          { sku: '', size: 'M', color: '', colorHex: '', stock: '0', available: true },
        ],
      }),
    ).toThrow();
  });
});
