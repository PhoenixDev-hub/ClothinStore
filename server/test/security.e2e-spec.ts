import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import multipart from '@fastify/multipart';
import { createClient } from '@supabase/supabase-js';
import { ProductsController } from '../src/products/products.controller';
import { ProductsService } from '../src/products/products.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AdminApiKeyGuard } from '../src/common/guards/admin-api-key.guard';
import { AdminAuthService } from '../src/auth/admin-auth.service';
import { UploadController } from '../src/upload/upload.controller';
import { UploadService } from '../src/upload/upload.service';
import { MAX_IMAGE_BYTES } from '../src/upload/upload.utils';
import { CORS_METHODS } from '../src/config/cors';
import { registerSecurityHeaders } from '../src/config/security';

jest.mock('@nestjs/cache-manager', () => ({
  CACHE_MANAGER: 'CACHE_MANAGER',
}));
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

const ALLOWED_ORIGIN = 'http://localhost:5174';
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const EXE = Buffer.from('MZ\x90\x00\x03\x00\x00\x00', 'latin1');

const form = (
  content: Buffer,
  filename: string,
  contentType: string,
): { payload: Buffer; headers: Record<string, string> } => {
  const boundary = '----security-boundary';
  const payload = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`,
    ),
    content,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  return {
    payload,
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
      'x-api-key': 'security-test-admin-key',
    },
  };
};

describe('Security: injection, upload and headers (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: {
    product: {
      count: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  const upload = jest.fn();

  beforeAll(async () => {
    prisma = {
      product: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest
        .fn()
        .mockImplementation((operations: Promise<unknown>[]) =>
          Promise.all(operations),
        ),
    };

    upload.mockResolvedValue({ error: null });
    (createClient as jest.Mock).mockReturnValue({
      storage: {
        getBucket: jest.fn().mockResolvedValue({ data: { id: 'bucket' } }),
        createBucket: jest.fn(),
        from: jest.fn(() => ({
          upload,
          getPublicUrl: (path: string) => ({
            data: { publicUrl: `https://cdn.test/${path}` },
          }),
        })),
      },
    });

    const moduleFixture = await Test.createTestingModule({
      controllers: [ProductsController, UploadController],
      providers: [
        ProductsService,
        UploadService,
        AdminApiKeyGuard,
        {
          provide: AdminAuthService,
          useValue: { isSessionValid: jest.fn().mockResolvedValue(false) },
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
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'ADMIN_API_KEY' ? 'security-test-admin-key' : undefined,
            getOrThrow: (key: string) =>
              key === 'SUPABASE_URL'
                ? 'https://project.supabase.co'
                : 'service-role-key',
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.register(multipart, {
      limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
    });
    await registerSecurityHeaders(app);
    app.enableCors({
      origin: [ALLOWED_ORIGIN],
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
    await app?.close();
  });

  beforeEach(() => {
    upload.mockClear();
    prisma.product.count.mockClear();
    prisma.product.findMany.mockClear();
    prisma.product.findFirst.mockClear();
  });

  describe('SQL injection and XSS in search/filter', () => {
    const injection = "' OR 1=1; DROP TABLE products; --";

    it('passes search and filter payloads as literal ORM values', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/products?search=${encodeURIComponent(injection)}&category=${encodeURIComponent(injection)}&size=${encodeURIComponent(injection)}&color=${encodeURIComponent(injection)}`,
      });

      expect(response.statusCode).toBe(200);
      const where = (
        prisma.product.count.mock.calls.at(-1) as unknown as [
          {
            where: {
              OR: [{ name: { contains: string } }];
              category: { OR: [{ slug: string }] };
              variants: { some: { size: string; color: string } };
            };
          },
        ]
      )[0].where;
      expect(where.OR[0].name.contains).toBe(injection);
      expect(where.category.OR[0].slug).toBe(injection);
      expect(where.variants.some).toMatchObject({
        size: injection,
        color: injection,
      });
    });

    it('serves search results as JSON, not executable HTML', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/products?search=${encodeURIComponent('<script>alert(1)</script>')}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.body).not.toContain('<script>');
    });

    it('encodes a reflected product slug as JSON, not HTML', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/products/${encodeURIComponent('<script>alert(1)</script>')}`,
      });

      expect(response.statusCode).toBe(404);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('upload hardening', () => {
    it('ignores a traversal filename and stores a generated path', async () => {
      const { payload, headers } = form(
        PNG,
        '../../../../etc/passwd.png',
        'image/png',
      );
      const response = await app.inject({
        method: 'POST',
        url: '/api/upload',
        headers,
        payload,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json<{ path: string }>();
      expect(body.path).toMatch(/^\d{4}\/\d{2}\/[0-9a-f-]{36}\.png$/);
      expect(body.path).not.toContain('..');
      expect(upload).toHaveBeenCalledWith(
        body.path,
        PNG,
        expect.objectContaining({ contentType: 'image/png' }),
      );
    });

    it('rejects an executable renamed to .jpg', async () => {
      const { payload, headers } = form(EXE, 'malware.jpg', 'image/jpeg');
      const response = await app.inject({
        method: 'POST',
        url: '/api/upload',
        headers,
        payload,
      });

      expect(response.statusCode).toBe(415);
      expect(upload).not.toHaveBeenCalled();
    });

    it('rejects an invalid declared MIME type', async () => {
      const { payload, headers } = form(PNG, 'image.png', 'text/plain');
      const response = await app.inject({
        method: 'POST',
        url: '/api/upload',
        headers,
        payload,
      });

      expect(response.statusCode).toBe(415);
      expect(upload).not.toHaveBeenCalled();
    });

    it('rejects uploads larger than 5 MB', async () => {
      const oversized = Buffer.concat([
        PNG,
        Buffer.alloc(MAX_IMAGE_BYTES + 1 - PNG.length),
      ]);
      const { payload, headers } = form(oversized, 'big.png', 'image/png');
      const response = await app.inject({
        method: 'POST',
        url: '/api/upload',
        headers,
        payload,
      });

      expect(response.statusCode).toBe(413);
      expect(upload).not.toHaveBeenCalled();
    });
  });

  describe('CORS', () => {
    it('blocks a disallowed origin', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/products',
        headers: {
          origin: 'https://evil.example',
          'access-control-request-method': 'GET',
        },
      });

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('allows the configured admin origin', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/products',
        headers: {
          origin: ALLOWED_ORIGIN,
          'access-control-request-method': 'GET',
        },
      });

      expect(response.headers['access-control-allow-origin']).toBe(
        ALLOWED_ORIGIN,
      );
    });
  });

  describe('security headers', () => {
    it('sets the hardening headers on every response', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/products',
      });

      expect(response.headers['content-security-policy']).toContain(
        "default-src 'self'",
      );
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['strict-transport-security']).toContain(
        'max-age=',
      );
      expect(response.headers['referrer-policy']).toBe('no-referrer');
      expect(response.headers['cross-origin-opener-policy']).toBe(
        'same-origin',
      );
    });
  });
});
