import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AdminAuthService,
  ADMIN_SESSION_TTL_SECONDS,
} from './admin-auth.service';

describe('AdminAuthService', () => {
  const configuredKey = 'test-admin-key-that-is-long-enough-0001';
  let redis: { get: jest.Mock; set: jest.Mock; del: jest.Mock };
  let service: AdminAuthService;

  beforeEach(() => {
    redis = {
      get: jest.fn().mockResolvedValue('1'),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
    };
    const config = {
      getOrThrow: jest.fn().mockReturnValue(configuredKey),
      get: jest.fn(),
    } as unknown as ConfigService;
    service = new AdminAuthService(config, redis);
  });

  it('accepts the configured admin key', () => {
    expect(() => service.verifyAdminKey(configuredKey)).not.toThrow();
  });

  it('rejects an invalid admin key', () => {
    expect(() => service.verifyAdminKey('wrong-key')).toThrow(
      UnauthorizedException,
    );
  });

  it('stores a random session for eight hours', async () => {
    const token = await service.createSession();

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(redis.set).toHaveBeenCalledWith(
      `admin:session:${token}`,
      '1',
      'EX',
      ADMIN_SESSION_TTL_SECONDS,
    );
    expect(ADMIN_SESSION_TTL_SECONDS).toBe(28_800);
  });

  it('refuses to create a session when Redis is unavailable', async () => {
    redis.set.mockRejectedValue(new Error('redis unavailable'));

    await expect(service.createSession()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('validates and revokes sessions by opaque token', async () => {
    const token = 'opaque-session';

    await expect(service.isSessionValid(token)).resolves.toBe(true);
    expect(redis.get).toHaveBeenCalledWith(`admin:session:${token}`);

    await service.revokeSession(token);
    expect(redis.del).toHaveBeenCalledWith(`admin:session:${token}`);
  });

  it('fails closed if the session store is unavailable', async () => {
    redis.get.mockRejectedValue(new Error('redis unavailable'));

    await expect(service.isSessionValid('opaque-session')).resolves.toBe(false);
  });

  it('rejects an absent session token', async () => {
    await expect(service.isSessionValid()).resolves.toBe(false);
    expect(redis.get).not.toHaveBeenCalled();
  });
});
