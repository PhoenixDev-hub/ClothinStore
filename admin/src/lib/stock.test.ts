import { describe, expect, it } from 'vitest';
import { stockState } from './stock';

describe('stockState', () => {
  it('marks zero as out of stock', () => {
    expect(stockState(0)).toBe('out');
  });

  it('marks 1 to 4 as low stock', () => {
    expect(stockState(1)).toBe('low');
    expect(stockState(4)).toBe('low');
  });

  it('marks 5 or more as ok', () => {
    expect(stockState(5)).toBe('ok');
    expect(stockState(50)).toBe('ok');
  });
});
