import { CacheModule, type CacheOptions } from '@nestjs/cache-manager';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { createKeyvNonBlocking as createRedisKeyv } from '@keyv/redis';
import { createKeyv } from 'cacheable';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
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
          Logger.warn(
            `Redis indisponível em ${host}:${port}; usando cache em memória`,
            'CacheModule',
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
    ProductsModule,
    CartModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
