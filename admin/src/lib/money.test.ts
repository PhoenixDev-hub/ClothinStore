import { describe, expect, it } from 'vitest';
import { formatCents, formatCentsInput, parseBRLToCents } from './money';

describe('money helpers', () => {
  it('parses reais input into integer centavos', () => {
    expect(parseBRLToCents('59,90')).toBe(5990);
    expect(parseBRLToCents('1.234,56')).toBe(123456);
    expect(parseBRLToCents('59.90')).toBe(5990);
  });

  it('formats API centavos for display and editable input', () => {
    expect(formatCents(5990)).toBe('R$ 59,90');
    expect(formatCentsInput(123456)).toBe('1234,56');
  });

  it('rejects malformed, negative, and over-precise prices', () => {
    expect(() => parseBRLToCents('')).toThrow();
    expect(() => parseBRLToCents('-2,00')).toThrow();
    expect(() => parseBRLToCents('2,001')).toThrow();
  });
});
