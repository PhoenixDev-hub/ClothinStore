import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { FastifyRequest } from 'fastify';

const sha256 = (value: string) => createHash('sha256').update(value).digest();

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('ADMIN_API_KEY');
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const header = request.headers['x-api-key'];
    const provided = Array.isArray(header) ? header[0] : header;

    if (
      !expected ||
      !provided ||
      !timingSafeEqual(sha256(provided), sha256(expected))
    ) {
      throw new UnauthorizedException('API key ausente ou inválida');
    }
    return true;
  }
}
