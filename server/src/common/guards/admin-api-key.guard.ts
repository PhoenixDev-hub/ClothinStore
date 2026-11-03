import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyRequest } from 'fastify';
import { createHash, timingSafeEqual } from 'node:crypto';
import { AdminAuthService } from '../../auth/admin-auth.service';

const sha256 = (value: string) => createHash('sha256').update(value).digest();

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly auth: AdminAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const expected = this.config.get<string>('ADMIN_API_KEY');
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const header = request.headers['x-api-key'];
    const provided = Array.isArray(header) ? header[0] : header;
    const session = request.cookies?.admin_session;

    const validHeader = Boolean(
      expected &&
      provided &&
      timingSafeEqual(sha256(provided), sha256(expected)),
    );
    if (validHeader || (await this.auth.isSessionValid(session))) return true;

    throw new UnauthorizedException(
      'Sessão admin ou x-api-key ausente ou inválida',
    );
  }
}
