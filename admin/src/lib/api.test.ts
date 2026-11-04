import { describe, expect, it } from 'vitest';
import { api, isAdminLoginRequest, isUnauthorizedError } from './api';

describe('admin API client', () => {
  it('sends cookie credentials and never configures an admin key', () => {
    expect(api.defaults.withCredentials).toBe(true);
    expect(api.defaults.headers.common).not.toHaveProperty('x-api-key');
    expect(api.defaults.baseURL).toBe('http://localhost:3001/api');
  });

  it('keeps login 401 responses on the login page and redirects protected routes', () => {
    expect(isAdminLoginRequest('/auth/admin')).toBe(true);
    expect(isAdminLoginRequest('/auth/admin/')).toBe(true);
    expect(isAdminLoginRequest('/auth/admin/me')).toBe(false);
    expect(isAdminLoginRequest('/products')).toBe(false);
  });

  it('distinguishes expired sessions from network errors', () => {
    expect(
      isUnauthorizedError(
        Object.assign(new Error('unauthorized'), {
          isAxiosError: true,
          response: { status: 401 },
        }),
      ),
    ).toBe(true);
    expect(isUnauthorizedError(new Error('offline'))).toBe(false);
  });
});
