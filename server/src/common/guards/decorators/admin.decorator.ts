import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AdminApiKeyGuard } from '../admin-api-key.guard';

export const Admin = () =>
  applyDecorators(
    UseGuards(AdminApiKeyGuard),
    ApiSecurity('api-key'),
    ApiUnauthorizedResponse({ description: 'x-api-key ausente ou inválida' }),
  );
