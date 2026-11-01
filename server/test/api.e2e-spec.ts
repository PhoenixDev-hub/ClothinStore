import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { CartController } from '../src/cart/cart.controller';
import { CartService } from '../src/cart/cart.service';
import { AdminApiKeyGuard } from '../src/common/guards/admin-api-key.guard';
import { ProductStatus } from '../src/generated/prisma/client';
import { HealthController } from '../src/health/health.controller';
import { PrismaService } from '../src/prisma/prisma.service';
import { ProductsController } from '../src/products/products.controller';
import { ProductsService } from '../src/products/products.service';

jest.mock('@nestjs/cache-manager', () => ({
  CACHE_MANAGER: 'CACHE_MANAGER',
}));

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    ping: jest.fn().mockResolvedValue('PONG'),
    on: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

const ADMIN_KEY = 'test-admin-key-with-at-least-32-characters';
const WHATSAPP_NUMBER = '5585999999999';

const activeProduct = {
  id: 1,
  name: 'Camiseta',
  slug: 'camiseta',
  description: 'Camiseta de algodão',
  price: 5990,
  status: ProductStatus.ACTIVE,
  category: { id: 1, name: 'Camisetas', slug: 'camisetas' },
  variants: [
    {
      sku: 'CAM-M-BRANCO',
      size: 'M',
      color: 'Branco',
      stock: 5,
      available: true,
    },
  ],
};

describe('Critical endpoints (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: {
    product: {
      count: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
    };
    variant: { findMany: jest.Mock };
    $transaction: jest.Mock;
    $queryRaw: jest.Mock;
  };

  beforeAll(async () => {
    prisma = {
      product: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(activeProduct),
      },
      variant: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest
        .fn()
        .mockImplementation((operations: Promise<unknown>[]) =>
          Promise.all(operations),
        ),
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              ADMIN_API_KEY: ADMIN_KEY,
              WHATSAPP_NUMBER,
              REDIS_HOST: 'localhost',
              REDIS_PORT: 6379,
              NODE_ENV: 'test',
            }),
          ],
        }),
      ],
      controllers: [
        AppController,
        ProductsController,
        CartController,
        HealthController,
      ],
      providers: [
        AppService,
        ProductsService,
        CartService,
        AdminApiKeyGuard,
        { provide: PrismaService, useValue: prisma },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/products', () => {
    it('lists ACTIVE products with pagination and category filter', async () => {
      prisma.product.count.mockResolvedValue(1);
      prisma.product.findMany.mockResolvedValue([activeProduct]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/products?page=1&limit=5&category=camisetas',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<{
        meta: { total: number; page: number; limit: number };
        data: { slug: string; totalStock: number }[];
      }>();
      expect(body.meta).toMatchObject({ total: 1, page: 1, limit: 5 });
      expect(body.data[0]).toMatchObject({ slug: 'camiseta', totalStock: 5 });
      const countCalls = prisma.product.count.mock.calls as [
        { where: unknown },
      ][];
      expect(countCalls.at(-1)?.[0].where).toMatchObject({
        status: ProductStatus.ACTIVE,
        category: {
          OR: [{ slug: 'camisetas' }, { parent: { slug: 'camisetas' } }],
        },
      });
    });
  });

  describe('GET /api/products/:slug', () => {
    it('returns 200 for an existing product', async () => {
      prisma.product.findFirst.mockResolvedValue(activeProduct);

      const response = await app.inject({
        method: 'GET',
        url: '/api/products/camiseta',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        slug: 'camiseta',
        totalStock: 5,
      });
    });

    it('returns 404 for an unknown product', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/products/nao-existe',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/cart/quote', () => {
    beforeEach(() => {
      prisma.variant.findMany.mockResolvedValue([
        {
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
        },
      ]);
    });

    it('returns 200 with a valid payload', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/cart/quote',
        payload: { items: [{ sku: 'CAM-M-BRANCO', quantity: 2 }] },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ subtotal: 11980, total: 11980 });
    });

    it('returns 400 with an invalid payload', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/cart/quote',
        payload: { items: [{ sku: 'CAM-M-BRANCO', quantity: 0 }] },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/cart/whatsapp', () => {
    it('returns 200 and a formatted WhatsApp URL', async () => {
      prisma.variant.findMany.mockResolvedValue([
        {
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
        },
      ]);

      const response = await app.inject({
        method: 'POST',
        url: '/api/cart/whatsapp',
        payload: { items: [{ sku: 'CAM-M-BRANCO', quantity: 1 }] },
      });

      expect(response.statusCode).toBe(200);
      const { whatsappUrl } = response.json<{ whatsappUrl: string }>();
      expect(
        whatsappUrl.startsWith(`https://wa.me/${WHATSAPP_NUMBER}?text=`),
      ).toBe(true);
      expect(decodeURIComponent(whatsappUrl.split('?text=')[1])).toContain(
        '1x Camiseta (M, Branco)',
      );
    });
  });

  describe('POST /api/products', () => {
    const payload = {
      name: 'Camiseta',
      slug: 'camiseta',
      description: 'Camiseta de algodão',
      price: 5990,
      images: ['https://example.com/camiseta.jpg'],
      categoryId: 1,
    };

    it('returns 401 without x-api-key', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload,
      });

      expect(response.statusCode).toBe(401);
      expect(prisma.product.create).not.toHaveBeenCalled();
    });

    it('returns 201 with a valid x-api-key', async () => {
      prisma.product.create.mockResolvedValue(activeProduct);

      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        headers: { 'x-api-key': ADMIN_KEY },
        payload,
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toMatchObject({ slug: 'camiseta' });
    });
  });

  describe('GET /api/health', () => {
    it('returns 200', async () => {
      const response = await app.inject({ method: 'GET', url: '/api/health' });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        status: 'ok',
        database: true,
        redis: true,
      });
    });
  });
});
