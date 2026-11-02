import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { LIST_VERSION_KEY, slugKey } from './products.cache';
import { ProductsService } from './products.service';

jest.mock('@nestjs/cache-manager', () => ({
  CACHE_MANAGER: 'CACHE_MANAGER',
}));

const productRow = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'Camiseta',
  slug: 'camiseta',
  price: 5990,
  status: ProductStatus.ACTIVE,
  variants: [],
  ...overrides,
});

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    product: {
      count: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    variant: { deleteMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let cache: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  const query = (overrides: Partial<QueryProductsDto> = {}) => ({
    page: 1,
    limit: 12,
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      product: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      variant: { deleteMany: jest.fn() },
      $transaction: jest
        .fn()
        .mockImplementation((operations: Promise<unknown>[]) =>
          Promise.all(operations),
        ),
    };
    cache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  const whereFromLastList = (): unknown =>
    (
      prisma.product.count.mock.calls.at(-1) as [{ where: unknown }] | undefined
    )?.[0].where;

  describe('findAll filters', () => {
    it('filters by category slug including subcategories', async () => {
      await service.findAll(query({ category: 'camisetas' }));

      expect(whereFromLastList()).toMatchObject({
        category: {
          OR: [{ slug: 'camisetas' }, { parent: { slug: 'camisetas' } }],
        },
      });
    });

    it('filters by size and color through variants.some', async () => {
      await service.findAll(query({ size: 'M', color: 'Preto' }));

      expect(whereFromLastList()).toMatchObject({
        variants: { some: { size: 'M', color: 'Preto' } },
      });
    });

    it('filters by min and max price', async () => {
      await service.findAll(query({ minPrice: 1000, maxPrice: 5000 }));

      expect(whereFromLastList()).toMatchObject({
        price: { gte: 1000, lte: 5000 },
      });
    });

    it('always restricts the public list to ACTIVE products', async () => {
      await service.findAll(query());

      expect(whereFromLastList()).toMatchObject({
        status: ProductStatus.ACTIVE,
      });
    });

    it('ignores status=DRAFT on the public list and still forces ACTIVE', async () => {
      await service.findAll(query({ status: ProductStatus.DRAFT }));

      expect(whereFromLastList()).toMatchObject({
        status: ProductStatus.ACTIVE,
      });
    });

    it('counts totalStock only from available variants', async () => {
      prisma.product.count.mockResolvedValue(1);
      prisma.product.findMany.mockResolvedValue([
        productRow({
          variants: [
            { stock: 10, available: false },
            { stock: 3, available: true },
            { stock: 2, available: true },
          ],
        }),
      ]);

      const result = await service.findAll(query());

      expect(result.data[0]).toMatchObject({ totalStock: 5, inStock: true });
    });
  });

  describe('findOne', () => {
    it('returns 404 when the product does not exist', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nao-existe')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findAllAdmin', () => {
    it('lists every status when no status filter is given', async () => {
      await service.findAllAdmin(query());

      expect(whereFromLastList()).not.toHaveProperty('status');
    });

    it('filters by status when given', async () => {
      await service.findAllAdmin(query({ status: ProductStatus.DRAFT }));

      expect(whereFromLastList()).toMatchObject({
        status: ProductStatus.DRAFT,
      });
    });

    it('does not use the public cache', async () => {
      await service.findAllAdmin(query());

      expect(cache.get).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
    });
  });

  describe('findOneAdmin', () => {
    it('returns a DRAFT product by id', async () => {
      prisma.product.findUnique.mockResolvedValue(
        productRow({
          id: 2,
          slug: 'rascunho',
          status: ProductStatus.DRAFT,
          variants: [{ stock: 3, available: true }],
        }),
      );

      const result = await service.findOneAdmin(2);

      const calls = prisma.product.findUnique.mock.calls as [
        { where: { id: number } },
      ][];
      expect(calls.at(-1)?.[0].where).toEqual({ id: 2 });
      expect(result).toMatchObject({
        slug: 'rascunho',
        status: ProductStatus.DRAFT,
        totalStock: 3,
      });
    });

    it('returns 404 when the product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findOneAdmin(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('write operations', () => {
    it('invalidates the list cache on create', async () => {
      prisma.product.create.mockResolvedValue(productRow({ slug: 'nova' }));

      await service.create({ slug: 'nova' } as CreateProductDto);

      expect(cache.set).toHaveBeenCalledWith(
        LIST_VERSION_KEY,
        expect.any(Number),
        0,
      );
      expect(cache.del).toHaveBeenCalledWith(slugKey('nova'));
    });

    it('invalidates both old and new slug cache on update', async () => {
      prisma.product.findUnique.mockResolvedValue({ slug: 'antiga' });
      prisma.product.update.mockResolvedValue(productRow({ slug: 'nova' }));

      await service.update(1, { slug: 'nova' });

      expect(cache.set).toHaveBeenCalledWith(
        LIST_VERSION_KEY,
        expect.any(Number),
        0,
      );
      expect(cache.del).toHaveBeenCalledWith(slugKey('antiga'));
      expect(cache.del).toHaveBeenCalledWith(slugKey('nova'));
    });

    it('invalidates cache on delete', async () => {
      prisma.product.findUnique.mockResolvedValue({ slug: 'camiseta' });
      prisma.product.delete.mockResolvedValue(productRow());

      await service.remove(1);

      expect(cache.set).toHaveBeenCalledWith(
        LIST_VERSION_KEY,
        expect.any(Number),
        0,
      );
      expect(cache.del).toHaveBeenCalledWith(slugKey('camiseta'));
    });

    it('returns 409 for a duplicate slug', async () => {
      prisma.product.create.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.create({ slug: 'camiseta' } as CreateProductDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('returns 400 when categoryId does not exist', async () => {
      prisma.product.create.mockRejectedValue({ code: 'P2003' });

      await expect(
        service.create({ slug: 'nova', categoryId: 999 } as CreateProductDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
