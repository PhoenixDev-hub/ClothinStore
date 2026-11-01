import { createKeyvNonBlocking as createRedisKeyv } from '@keyv/redis';
import { CacheModule, type CacheOptions } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { createKeyv } from 'cacheable';
import { LoggerModule, PinoLogger } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CartModule } from './cart/cart.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { HealthModule } from './health/health.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        pinoHttp: {
          level: configService.get<string>('LOG_LEVEL', 'info'),
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers["x-api-key"]',
              'req.body.password',
            ],
            censor: '[REDACTED]',
          },
        },
      }),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService, PinoLogger],
      useFactory: async (configService: ConfigService, logger: PinoLogger) => {
        const host = configService.get<string>('REDIS_HOST', 'localhost');
        const port = configService.get<number>('REDIS_PORT', 6379);
        const ttl = 60_000;

        const memory = createKeyv();
        const redis = createRedisKeyv(`redis://${host}:${port}`, {
          connectionTimeout: 1500,
        });

        const client = (
          redis.store as unknown as {
            client?: { connect: () => Promise<unknown> };
          }
        ).client;

        const redisAvailable = await Promise.race([
          (client?.connect() ?? Promise.reject(new Error('sem client')))
            .then(() => true)
            .catch(() => false),
          new Promise<boolean>((resolve) =>
            setTimeout(() => resolve(false), 1500),
          ),
        ]);

        if (!redisAvailable) {
          logger.warn(
            { host, port },
            'Redis indisponível; usando cache em memória',
          );
          await redis.disconnect();
          return { stores: [memory], ttl } as unknown as CacheOptions;
        }

        return {
          stores: [memory, redis],
          ttl,
        } as unknown as CacheOptions;
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 100,
      },
    ]),
    PrismaModule,
    ProductsModule,
    CartModule,
    UploadModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
