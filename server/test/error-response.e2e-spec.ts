import { Controller, Get } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

@Controller('boom')
class BoomController {
  @Get()
  boom(): never {
    throw new Error(
      'password=hunter2 at /srv/app/src/secret.ts:42 (internal detail)',
    );
  }
}

describe('Unhandled errors (e2e)', () => {
  let app: NestFastifyApplication;
  const logger = {
    setContext: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [BoomController],
      providers: [
        { provide: PinoLogger, useValue: logger },
        { provide: APP_FILTER, useClass: AllExceptionsFilter },
      ],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('returns a generic 500 without stack, paths or secrets', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/boom' });

    expect(response.statusCode).toBe(500);
    const body = response.json<{ message: string; error: string }>();
    expect(body.message).toBe('Erro interno do servidor');
    expect(body.error).toBe('Internal Server Error');
    const raw = response.body;
    expect(raw).not.toContain('hunter2');
    expect(raw).not.toContain('/srv/app');
    expect(raw).not.toContain('secret.ts');
    expect(raw).not.toContain('stack');
    expect(logger.error).toHaveBeenCalled();
  });
});
