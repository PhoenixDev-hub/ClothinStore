import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import cookie from '@fastify/cookie';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AdminAuthController } from '../src/auth/admin-auth.controller';
import { AdminAuthService } from '../src/auth/admin-auth.service';

describe('Admin login throttling (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
      ],
      controllers: [AdminAuthController],
      providers: [
        {
          provide: AdminAuthService,
          useValue: {
            verifyAdminKey: jest.fn(),
            createSession: jest.fn().mockResolvedValue('opaque-session'),
          },
        },
        { provide: ConfigService, useValue: { get: () => 'test-key' } },
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

  it('rejects the sixth admin login attempt from the same IP in one minute', async () => {
    const responses = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      responses.push(
        await app.inject({
          method: 'POST',
          url: '/api/auth/admin',
          payload: { apiKey: 'test-key' },
        }),
      );
    }

    expect(responses.slice(0, 5).map(({ statusCode }) => statusCode)).toEqual([
      201, 201, 201, 201, 201,
    ]);
    expect(responses[5].statusCode).toBe(429);
  });
});
