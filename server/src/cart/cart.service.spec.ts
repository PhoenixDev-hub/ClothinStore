import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from './cart.service';
import { CartItemDto } from './dto/cart-item.dto';

const variant = (overrides: Record<string, unknown> = {}) => ({
  sku: 'CAM-M-BRANCO',
  size: 'M',
  color: 'Branco',
  stock: 5,
  available: true,
  price: null,
  product: {
    name: 'Camiseta',
    price: 5990,
    status: ProductStatus.ACTIVE,
  },
  ...overrides,
});

describe('CartService', () => {
  let service: CartService;
  let prisma: { variant: { findMany: jest.Mock } };
  let config: { get: jest.Mock };

  const items = (...values: Partial<CartItemDto>[]) =>
    values.map((value) => ({
      sku: 'CAM-M-BRANCO',
      quantity: 1,
      ...value,
    })) as CartItemDto[];

  beforeEach(async () => {
    prisma = { variant: { findMany: jest.fn().mockResolvedValue([]) } };
    config = { get: jest.fn().mockReturnValue('5585999999999') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  it('quotes available and unavailable items together', async () => {
    prisma.variant.findMany.mockResolvedValue([
      variant(),
      variant({ sku: 'CAM-G-PRETO', available: false }),
    ]);

    const quote = await service.quote(
      items({ sku: 'CAM-M-BRANCO', quantity: 2 }, { sku: 'CAM-G-PRETO' }),
    );

    expect(quote.items).toHaveLength(2);
    expect(quote.availableItems).toHaveLength(1);
    expect(quote.unavailableItems).toHaveLength(1);
    expect(quote.unavailableItems[0].reason).toBe('UNAVAILABLE');
    expect(quote.subtotal).toBe(11980);
    expect(quote.total).toBe(11980);
  });

  it('uses the database price and ignores any client price', async () => {
    prisma.variant.findMany.mockResolvedValue([variant()]);

    const quote = await service.quote(
      items({
        sku: 'CAM-M-BRANCO',
        quantity: 1,
        price: 1,
      } as Partial<CartItemDto>),
    );

    expect(quote.items[0].unitPrice).toBe(5990);
    expect(quote.items[0].subtotal).toBe(5990);
  });

  it('marks quantity above stock as insufficient and exposes maxStock', async () => {
    prisma.variant.findMany.mockResolvedValue([variant({ stock: 3 })]);

    const quote = await service.quote(
      items({ sku: 'CAM-M-BRANCO', quantity: 10 }),
    );

    expect(quote.items[0]).toMatchObject({
      available: false,
      reason: 'INSUFFICIENT_STOCK',
      maxStock: 3,
      subtotal: 0,
    });
  });

  it('builds the WhatsApp message with available items only', async () => {
    prisma.variant.findMany.mockResolvedValue([
      variant(),
      variant({ sku: 'CAM-G-PRETO', available: false }),
    ]);
    const quote = await service.quote(
      items({ sku: 'CAM-M-BRANCO', quantity: 1 }, { sku: 'CAM-G-PRETO' }),
    );

    const result = service.generateWhatsAppMessage(quote);

    expect(result.message).toContain('1x Camiseta (M, Branco)');
    expect(result.message).not.toContain('CAM-G-PRETO');
    expect(result.message).toContain('Total: R$ 59,90');
  });

  it('encodes the WhatsApp URL text correctly', async () => {
    prisma.variant.findMany.mockResolvedValue([variant()]);
    const quote = await service.quote(items({ sku: 'CAM-M-BRANCO' }));

    const result = service.generateWhatsAppMessage(quote);

    expect(result.whatsappUrl).toBe(
      `https://wa.me/5585999999999?text=${encodeURIComponent(result.message)}`,
    );
  });

  it('refuses to generate a message without available items', async () => {
    const emptyQuote = await service.quote(items({ sku: 'NAO-EXISTE' }));

    expect(() => service.generateWhatsAppMessage(emptyQuote)).toThrow(
      BadRequestException,
    );
  });
});
