import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard';
import {
  ADMIN_REDIS_CLIENT,
  AdminAuthService,
  createAdminRedisClient,
} from './admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';

@Global()
@Module({
  controllers: [AdminAuthController],
  providers: [
    {
      provide: ADMIN_REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: createAdminRedisClient,
    },
    AdminAuthService,
    AdminApiKeyGuard,
  ],
  exports: [AdminAuthService, AdminApiKeyGuard],
})
export class AdminAuthModule {}
