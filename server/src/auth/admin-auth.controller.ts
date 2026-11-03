import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Admin } from '../common/guards/decorators/admin.decorator';
import { AdminLoginDto } from './dto/admin-login.dto';
import {
  AdminAuthService,
  ADMIN_SESSION_TTL_SECONDS,
} from './admin-auth.service';

export const ADMIN_SESSION_COOKIE = 'admin_session';

@ApiTags('admin-auth')
@Controller('auth/admin')
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Autentica o painel admin e cria uma sessão segura',
  })
  @ApiCreatedResponse({ description: 'Sessão admin criada por oito horas' })
  @ApiBadRequestResponse({ description: 'Chave ausente' })
  @ApiUnauthorizedResponse({ description: 'Chave admin inválida' })
  @ApiTooManyRequestsResponse({
    description: 'Limite de cinco tentativas por minuto atingido',
  })
  async login(
    @Body() dto: AdminLoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    this.auth.verifyAdminKey(dto.apiKey);
    const token = await this.auth.createSession();
    reply.setCookie(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/api',
      maxAge: ADMIN_SESSION_TTL_SECONDS,
    });
    return { authenticated: true };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Encerra a sessão admin atual' })
  @ApiNoContentResponse({ description: 'Sessão encerrada e cookie limpo' })
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    try {
      await this.auth.revokeSession(request.cookies[ADMIN_SESSION_COOKIE]);
    } finally {
      reply.clearCookie(ADMIN_SESSION_COOKIE, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/api',
      });
    }
  }

  @Admin()
  @Get('me')
  @ApiCookieAuth('admin-session')
  @ApiOkResponse({ description: 'Sessão admin válida' })
  me() {
    return { authenticated: true };
  }
}
