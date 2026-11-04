import {
  Injectable,
  OnModuleDestroy,
  ServiceUnavailableException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import Redis from 'ioredis';

export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;
export const ADMIN_REDIS_CLIENT = 'ADMIN_REDIS_CLIENT';
const SESSION_KEY_PREFIX = 'admin:session:';

export function createAdminRedisClient(config: ConfigService): Redis {
  const redis = new Redis({
    host: config.getOrThrow<string>('REDIS_HOST'),
    port: Number(config.getOrThrow<number>('REDIS_PORT')),
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => Math.min(times * 200, 1000),
  });
  redis.on('error', () => undefined);
  return redis;
}

@Injectable()
export class AdminAuthService implements OnModuleDestroy {
  constructor(
    private readonly config: ConfigService,
    @Inject(ADMIN_REDIS_CLIENT)
    private readonly redis: Pick<Redis, 'get' | 'set' | 'del'>,
  ) {}

  verifyAdminKey(provided: string): void {
    const expected = this.config.getOrThrow<string>('ADMIN_API_KEY');
    const digest = (value: string) =>
      createHash('sha256').update(value).digest();

    if (!provided || !timingSafeEqual(digest(provided), digest(expected))) {
      throw new UnauthorizedException('Chave admin inválida');
    }
  }

  async createSession(): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    try {
      await this.redis.set(
        this.sessionKey(token),
        '1',
        'EX',
        ADMIN_SESSION_TTL_SECONDS,
      );
      return token;
    } catch {
      throw new ServiceUnavailableException(
        'Sessões admin indisponíveis no momento',
      );
    }
  }

  async isSessionValid(token?: string): Promise<boolean> {
    if (!token) return false;
    try {
      return (await this.redis.get(this.sessionKey(token))) === '1';
    } catch {
      // Redis fora do ar é falha de infraestrutura, não sessão inválida
      throw new ServiceUnavailableException(
        'Sessões admin indisponíveis no momento',
      );
    }
  }

  async revokeSession(token?: string): Promise<void> {
    if (!token) return;
    await this.redis.del(this.sessionKey(token));
  }

  onModuleDestroy(): void {
    const client = this.redis as Redis;
    client.disconnect?.();
  }

  private sessionKey(token: string): string {
    return `${SESSION_KEY_PREFIX}${token}`;
  }
}
