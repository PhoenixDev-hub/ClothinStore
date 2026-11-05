import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { CORS_METHODS } from './config/cors';
import { MAX_IMAGE_BYTES } from './upload/upload.utils';

async function bootstrap() {
  const adapter = new FastifyAdapter({
    genReqId: (req: IncomingMessage) => {
      const header = req.headers['x-request-id'];
      return (Array.isArray(header) ? header[0] : header) ?? randomUUID();
    },
  });
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    { bufferLogs: true },
  );

  app.useLogger(app.get(Logger));
  const configService = app.get(ConfigService);

  await app.register(multipart, {
    limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  });
  await app.register(cookie);

  await app.register(helmet, { contentSecurityPolicy: false });
  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onSend', (request, reply, payload, done) => {
      reply.header('x-request-id', request.id);
      done();
    });
  const corsOrigins = configService
    .get<string>('CORS_ORIGIN', 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins,
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

  if (configService.get<string>('NODE_ENV', 'development') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Loja de Roupas API')
      .setDescription('API do MVP da loja de roupas')
      .setVersion('1.0')
      .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
      .addCookieAuth(
        'admin_session',
        { type: 'apiKey', in: 'cookie' },
        'admin-session',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  app.enableShutdownHooks();

  const port = configService.get<number>('PORT', 3001);

  await app.listen(port, '0.0.0.0');
}

void bootstrap();
