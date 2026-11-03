import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiSecurity,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminApiKeyGuard } from '../admin-api-key.guard';

export const Admin = () =>
  applyDecorators(
    UseGuards(AdminApiKeyGuard),
    ApiSecurity('api-key'),
    ApiCookieAuth('admin-session'),
    ApiUnauthorizedResponse({ description: 'Sessão ou x-api-key inválida' }),
  );
