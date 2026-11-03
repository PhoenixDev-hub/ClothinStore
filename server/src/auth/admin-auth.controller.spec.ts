import { AdminAuthController } from './admin-auth.controller';

describe('AdminAuthController', () => {
  it('limits admin login to five requests per minute', () => {
    const login = Object.getOwnPropertyDescriptor(
      AdminAuthController.prototype,
      'login',
    )?.value as object;

    expect(Reflect.getMetadata('THROTTLER:LIMITdefault', login)).toBe(5);
    expect(Reflect.getMetadata('THROTTLER:TTLdefault', login)).toBe(60_000);
  });
});
