import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import cookie from '@fastify/cookie';
import {
  ADMIN_REDIS_CLIENT,
  AdminAuthService,
} from '../src/auth/admin-auth.service';
import {
  ADMIN_SESSION_COOKIE,
  AdminAuthController,
} from '../src/auth/admin-auth.controller';
import { AdminApiKeyGuard } from '../src/common/guards/admin-api-key.guard';
import { AdminProductsController } from '../src/products/admin-products.controller';
import { ProductsService } from '../src/products/products.service';
import { ProductImportService } from '../src/products/product-import.service';

jest.mock('@nestjs/cache-manager', () => ({
  CACHE_MANAGER: 'CACHE_MANAGER',
}));

const ADMIN_KEY = 'test-admin-key-with-at-least-32-characters';

class MemoryRedis {
  readonly store = new Map<string, string>();

  get(key: string): Promise<string | null> {
    return Promise.resolve(this.store.get(key) ?? null);
  }

  set(key: string, value: string): Promise<'OK'> {
    this.store.set(key, value);
    return Promise.resolve('OK');
  }

  del(key: string): Promise<number> {
    return Promise.resolve(this.store.delete(key) ? 1 : 0);
  }
}

describe('Admin auth security (e2e)', () => {
  let app: NestFastifyApplication;
  let redis: MemoryRedis;
  let products: { findAllAdmin: jest.Mock };

  const config = {
    get: (key: string) => (key === 'ADMIN_API_KEY' ? ADMIN_KEY : undefined),
    getOrThrow: (key: string) => {
      if (key === 'ADMIN_API_KEY') return ADMIN_KEY;
      throw new Error(`missing ${key}`);
    },
  };

  beforeAll(async () => {
    redis = new MemoryRedis();
    products = { findAllAdmin: jest.fn().mockResolvedValue([]) };

    const moduleFixture = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
      ],
      controllers: [AdminAuthController, AdminProductsController],
      providers: [
        AdminAuthService,
        AdminApiKeyGuard,
        { provide: ADMIN_REDIS_CLIENT, useValue: redis },
        { provide: ConfigService, useValue: config },
        { provide: ProductsService, useValue: products },
        { provide: ProductImportService, useValue: {} },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
      ],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.register(cookie);
    app.setGlobalPrefix('api');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app?.close();
  });

  const login = (remoteAddress: string) =>
    app.inject({
      method: 'POST',
      url: '/api/auth/admin',
      payload: { apiKey: ADMIN_KEY },
      remoteAddress,
    });

  it('rejects admin routes without a session cookie with 401', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/products',
      remoteAddress: '10.0.0.1',
    });

    expect(response.statusCode).toBe(401);
    expect(products.findAllAdmin).not.toHaveBeenCalled();
  });

  it('rejects an invalid session cookie with 401', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/products',
      headers: { cookie: `${ADMIN_SESSION_COOKIE}=forged-token` },
      remoteAddress: '10.0.0.2',
    });

    expect(response.statusCode).toBe(401);
    expect(products.findAllAdmin).not.toHaveBeenCalled();
  });

  it('sets an HttpOnly, Secure, SameSite=Strict cookie on login', async () => {
    const response = await login('10.0.0.3');

    expect(response.statusCode).toBe(201);
    const setCookie = response.headers['set-cookie'] as string;
    expect(setCookie).toContain(`${ADMIN_SESSION_COOKIE}=`);
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Secure');
    expect(setCookie).toContain('SameSite=Strict');
  });

  it('blocks the sixth login attempt in one minute', async () => {
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await login('10.0.0.4');
      statuses.push(response.statusCode);
    }

    expect(statuses.slice(0, 5)).toEqual([201, 201, 201, 201, 201]);
    expect(statuses[5]).toBe(429);
  });

  it('invalidates the Redis session on logout', async () => {
    const loginResponse = await login('10.0.0.5');
    const setCookie = loginResponse.headers['set-cookie'] as string;
    const sessionCookie = setCookie.split(';')[0];
    const token = sessionCookie.split('=')[1];

    expect(await redis.get(`admin:session:${token}`)).toBe('1');
    const before = await app.inject({
      method: 'GET',
      url: '/api/admin/products',
      headers: { cookie: sessionCookie },
      remoteAddress: '10.0.0.5',
    });
    expect(before.statusCode).toBe(200);

    const logout = await app.inject({
      method: 'POST',
      url: '/api/auth/admin/logout',
      headers: { cookie: sessionCookie },
      remoteAddress: '10.0.0.5',
    });
    expect(logout.statusCode).toBe(204);
    expect(await redis.get(`admin:session:${token}`)).toBeNull();

    const after = await app.inject({
      method: 'GET',
      url: '/api/admin/products',
      headers: { cookie: sessionCookie },
      remoteAddress: '10.0.0.5',
    });
    expect(after.statusCode).toBe(401);
  });
});
