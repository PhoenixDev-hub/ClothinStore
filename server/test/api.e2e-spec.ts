import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ServiceUnavailableException,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
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
import { AdminAuthService } from '../src/auth/admin-auth.service';
import { AdminAuthController } from '../src/auth/admin-auth.controller';
import { CORS_METHODS } from '../src/config/cors';
import { ProductStatus } from '../src/generated/prisma/client';
import { HealthController } from '../src/health/health.controller';
import { PrismaService } from '../src/prisma/prisma.service';
import { AdminProductsController } from '../src/products/admin-products.controller';
import { CategoriesController } from '../src/products/categories.controller';
import { CategoriesService } from '../src/products/categories.service';
import { ProductsController } from '../src/products/products.controller';
import { ProductsService } from '../src/products/products.service';
import { ProductImportService } from '../src/products/product-import.service';
import { CategoryUploadController } from '../src/upload/category-upload.controller';
import { UploadService } from '../src/upload/upload.service';
import { MAX_IMAGE_BYTES } from '../src/upload/upload.utils';

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
const SESSION_TOKEN = 'opaque-admin-session-token';
const WHATSAPP_NUMBER = '5585999999999';
const adminAuth = {
  verifyAdminKey: jest.fn(),
  createSession: jest.fn().mockResolvedValue(SESSION_TOKEN),
  isSessionValid: jest.fn().mockResolvedValue(false),
  revokeSession: jest.fn(),
};

const uploadService = {
  uploadImage: jest.fn().mockResolvedValue({
    url: 'https://cdn.example.com/category.png',
    path: '2026/11/category.png',
  }),
};

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

const draftProduct = {
  ...activeProduct,
  id: 2,
  name: 'Rascunho',
  slug: 'rascunho',
  status: ProductStatus.DRAFT,
};

const csvMultipart = (content: string) => {
  const boundary = '----opencode-csv-boundary';
  const payload = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="products.csv"\r\nContent-Type: text/csv\r\n\r\n`,
    ),
    Buffer.from(content),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  return {
    payload,
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
      'x-api-key': ADMIN_KEY,
    },
  };
};

const imageMultipart = () => {
  const boundary = '----opencode-test-boundary';
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const payload = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="category.png"\r\nContent-Type: image/png\r\n\r\n`,
    ),
    png,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  return {
    payload,
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
      'x-api-key': ADMIN_KEY,
    },
  };
};

describe('Critical endpoints (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: {
    product: {
      count: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    variant: { findMany: jest.Mock; findUnique: jest.Mock };
    category: { findMany: jest.Mock };
    $transaction: jest.Mock;
    $queryRaw: jest.Mock;
  };

  beforeAll(async () => {
    prisma = {
      product: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(activeProduct),
      },
      variant: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      category: { findMany: jest.fn().mockResolvedValue([]) },
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
        AdminAuthController,
        ProductsController,
        AdminProductsController,
        CategoriesController,
        CategoryUploadController,
        CartController,
        HealthController,
      ],
      providers: [
        AppService,
        ProductsService,
        CategoriesService,
        ProductImportService,
        CartService,
        AdminApiKeyGuard,
        {
          provide: AdminAuthService,
          useValue: adminAuth,
        },
        {
          provide: UploadService,
          useValue: uploadService,
        },
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
    await app.register(cookie);
    await app.register(multipart, {
      limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
    });
    app.enableCors({
      origin: ['http://localhost:5174'],
      credentials: true,
      methods: CORS_METHODS,
    });
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

    it('ignores status=DRAFT and returns 200 with only ACTIVE products', async () => {
      prisma.product.count.mockResolvedValue(1);
      prisma.product.findMany.mockResolvedValue([activeProduct]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/products?status=DRAFT',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<{ data: { status: ProductStatus }[] }>();
      expect(body.data).toHaveLength(1);
      expect(body.data.every((p) => p.status === ProductStatus.ACTIVE)).toBe(
        true,
      );
      const countCalls = prisma.product.count.mock.calls as [
        { where: unknown },
      ][];
      expect(countCalls.at(-1)?.[0].where).toMatchObject({
        status: ProductStatus.ACTIVE,
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

  describe('GET /api/admin/products', () => {
    it('returns 401 without x-api-key', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/products',
      });

      expect(response.statusCode).toBe(401);
    });

    it('returns 200 including DRAFT products with a valid x-api-key', async () => {
      prisma.product.count.mockResolvedValue(2);
      prisma.product.findMany.mockResolvedValue([activeProduct, draftProduct]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/products',
        headers: { 'x-api-key': ADMIN_KEY },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<{
        data: { slug: string; status: ProductStatus }[];
      }>();
      expect(body.data.map((p) => p.slug)).toEqual(['camiseta', 'rascunho']);
      const countCalls = prisma.product.count.mock.calls as [
        { where: unknown },
      ][];
      expect(countCalls.at(-1)?.[0].where).not.toHaveProperty('status');
    });

    it('filters by status when given', async () => {
      prisma.product.count.mockResolvedValue(1);
      prisma.product.findMany.mockResolvedValue([draftProduct]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/products?status=DRAFT',
        headers: { 'x-api-key': ADMIN_KEY },
      });

      expect(response.statusCode).toBe(200);
      const countCalls = prisma.product.count.mock.calls as [
        { where: unknown },
      ][];
      expect(countCalls.at(-1)?.[0].where).toMatchObject({
        status: ProductStatus.DRAFT,
      });
    });
  });

  describe('POST /api/admin/categories/upload', () => {
    it('returns 401 without credentials', async () => {
      const { payload, headers } = imageMultipart();
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/categories/upload',
        headers: { 'content-type': headers['content-type'] },
        payload,
      });

      expect(response.statusCode).toBe(401);
      expect(uploadService.uploadImage).not.toHaveBeenCalled();
    });

    it('uploads an image and returns its public url', async () => {
      uploadService.uploadImage.mockClear();
      const { payload, headers } = imageMultipart();

      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/categories/upload',
        headers,
        payload,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        url: 'https://cdn.example.com/category.png',
      });
      expect(uploadService.uploadImage).toHaveBeenCalledWith(
        expect.any(Buffer),
      );
    });
  });

  describe('GET /api/categories', () => {
    it('returns the category image in the public list', async () => {
      prisma.category.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Camisetas',
          slug: 'camisetas',
          image: 'https://cdn.example.com/category.png',
        },
      ]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/categories',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([
        expect.objectContaining({
          slug: 'camisetas',
          image: 'https://cdn.example.com/category.png',
        }),
      ]);
    });
  });

  describe('admin session endpoints', () => {
    it('allows the configured admin origin to send credentialed requests', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/auth/admin',
        headers: {
          origin: 'http://localhost:5174',
          'access-control-request-method': 'POST',
        },
      });

      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:5174',
      );
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('allows the write methods used by the admin panel', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/products/7',
        headers: {
          origin: 'http://localhost:5174',
          'access-control-request-method': 'PUT',
          'access-control-request-headers': 'content-type,x-api-key',
        },
      });

      expect(response.statusCode).toBe(204);
      expect(response.headers['access-control-allow-methods']).toEqual(
        expect.stringContaining('PUT'),
      );
      expect(response.headers['access-control-allow-methods']).toEqual(
        expect.stringContaining('DELETE'),
      );
    });

    it('sets an HttpOnly, Secure, SameSite=Strict eight-hour cookie on login', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/admin',
        payload: { apiKey: ADMIN_KEY },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual({ authenticated: true });
      expect(response.headers['set-cookie']).toEqual(
        expect.stringContaining('admin_session='),
      );
      expect(response.headers['set-cookie']).toContain('HttpOnly');
      expect(response.headers['set-cookie']).toContain('Secure');
      expect(response.headers['set-cookie']).toContain('SameSite=Strict');
      expect(response.headers['set-cookie']).toContain('Max-Age=28800');
      expect(response.headers['set-cookie']).toContain('Path=/api');
      expect(adminAuth.verifyAdminKey).toHaveBeenCalledWith(ADMIN_KEY);
      expect(adminAuth.createSession).toHaveBeenCalled();
    });

    it('rejects an invalid key without creating a session', async () => {
      adminAuth.createSession.mockClear();
      adminAuth.verifyAdminKey.mockImplementationOnce(() => {
        throw new UnauthorizedException('invalid');
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/admin',
        payload: { apiKey: 'invalid' },
      });

      expect(response.statusCode).toBe(401);
      expect(adminAuth.createSession).not.toHaveBeenCalled();
    });

    it('validates the session cookie and clears it on logout', async () => {
      adminAuth.isSessionValid.mockResolvedValueOnce(true);
      const me = await app.inject({
        method: 'GET',
        url: '/api/auth/admin/me',
        headers: { cookie: `admin_session=${SESSION_TOKEN}` },
      });

      expect(me.statusCode).toBe(200);
      expect(adminAuth.isSessionValid).toHaveBeenCalledWith(SESSION_TOKEN);

      const logout = await app.inject({
        method: 'POST',
        url: '/api/auth/admin/logout',
        headers: { cookie: `admin_session=${SESSION_TOKEN}` },
      });

      expect(logout.statusCode).toBe(204);
      expect(adminAuth.revokeSession).toHaveBeenCalledWith(SESSION_TOKEN);
      expect(logout.headers['set-cookie']).toContain('admin_session=;');
      expect(logout.headers['set-cookie']).toContain(
        'Expires=Thu, 01 Jan 1970',
      );
      expect(logout.headers['set-cookie']).toContain('HttpOnly');
      expect(logout.headers['set-cookie']).toContain('Secure');
      expect(logout.headers['set-cookie']).toContain('SameSite=Strict');
    });

    it('returns 503 when the session store is unavailable', async () => {
      adminAuth.isSessionValid.mockRejectedValueOnce(
        new ServiceUnavailableException('Sessões admin indisponíveis'),
      );

      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/admin/me',
        headers: { cookie: `admin_session=${SESSION_TOKEN}` },
      });

      expect(response.statusCode).toBe(503);
    });
  });

  describe('GET /api/admin/products/:id', () => {
    it('returns 401 without x-api-key', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/products/2',
      });

      expect(response.statusCode).toBe(401);
    });

    it('returns 200 for a DRAFT product with a valid x-api-key', async () => {
      prisma.product.findUnique.mockResolvedValue(draftProduct);

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/products/2',
        headers: { 'x-api-key': ADMIN_KEY },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        slug: 'rascunho',
        status: ProductStatus.DRAFT,
      });
    });

    it('returns 404 for an unknown id', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/products/99',
        headers: { 'x-api-key': ADMIN_KEY },
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

  describe('POST /api/admin/products/import', () => {
    const header = 'nome,descrição,preço,categoria,tamanho,cor,estoque,imagem';

    it('returns 401 without credentials', async () => {
      const { payload } = csvMultipart(
        `${header}\nCamiseta,Desc,10,Camisetas,M,Branco,1,`,
      );
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/products/import',
        headers: {
          'content-type':
            'multipart/form-data; boundary=----opencode-csv-boundary',
        },
        payload,
      });

      expect(response.statusCode).toBe(401);
    });

    it('imports valid rows and reports invalid ones', async () => {
      prisma.category.findMany.mockResolvedValue([
        { id: 1, name: 'Camisetas', slug: 'camisetas' },
      ]);
      prisma.product.create.mockClear();
      prisma.product.create.mockResolvedValue(activeProduct);

      const csv = [
        header,
        'Camiseta,Descrição,59.90,Camisetas,M,Branco,5,https://cdn/c.png',
        'Sem categoria,Descrição,10,Inexistente,M,Branco,5,',
      ].join('\n');
      const { payload, headers } = csvMultipart(csv);

      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/products/import',
        headers,
        payload,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        criados: 1,
        erros: [{ linha: 3, motivo: 'Categoria "Inexistente" não encontrada' }],
      });
      expect(prisma.product.create).toHaveBeenCalledTimes(1);
    });

    it('returns 400 when required columns are missing', async () => {
      const { payload, headers } = csvMultipart('nome,preço\nCamiseta,10');

      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/products/import',
        headers,
        payload,
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('produto esgotado', () => {
    const soldOut = {
      ...activeProduct,
      variants: [
        {
          sku: 'CAM-M-BRANCO',
          size: 'M',
          color: 'Branco',
          stock: 0,
          available: true,
        },
      ],
    };

    it('returns the product with available:false and its variants', async () => {
      prisma.product.findFirst.mockResolvedValue(soldOut);

      const response = await app.inject({
        method: 'GET',
        url: '/api/products/camiseta',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        slug: 'camiseta',
        totalStock: 0,
        inStock: false,
        available: false,
        variants: [expect.objectContaining({ sku: 'CAM-M-BRANCO' })],
      });
    });

    it('blocks the cart quote with reason OUT_OF_STOCK', async () => {
      prisma.variant.findMany.mockResolvedValue([
        {
          sku: 'CAM-M-BRANCO',
          size: 'M',
          color: 'Branco',
          stock: 0,
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
        url: '/api/cart/quote',
        payload: { items: [{ sku: 'CAM-M-BRANCO', quantity: 1 }] },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        availableItems: [],
        items: [
          {
            available: false,
            reason: 'OUT_OF_STOCK',
            maxStock: 0,
            message: 'Produto esgotado',
          },
        ],
      });
    });

    it('blocks the WhatsApp link with a clear error', async () => {
      prisma.variant.findMany.mockResolvedValue([
        {
          sku: 'CAM-M-BRANCO',
          size: 'M',
          color: 'Branco',
          stock: 0,
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

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ message: 'Produto esgotado' });
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
