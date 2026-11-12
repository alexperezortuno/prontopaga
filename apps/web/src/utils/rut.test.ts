import { describe, expect, it } from 'vitest';
import { formatRut, isValidRut, normalizeRut, rutCaretPosition } from './rut';

describe('formatRut', () => {
  it.each([
    ['', ''],
    ['1', '1'],
    ['12', '12'],
    ['123', '123'],
    ['1234', '1.234'],
    ['12345', '12.345'],
    ['12345678', '12.345.678'],
    ['123456785', '12.345.678-5'],
    ['12345678k', '12.345.678-K'],
    ['12.345.678-5', '12.345.678-5'],
    ['12 345 678 5', '12.345.678-5'],
    ['1234567-5', '1.234.567-5'],
    ['abc12.345.678-5xyz', '12.345.678-5'],
  ])('formats %s as %s', (input, expected) => {
    expect(formatRut(input)).toBe(expected);
  });

  it('is idempotent', () => {
    const formatted = formatRut('12.345.678-5');
    expect(formatRut(formatted)).toBe(formatted);
  });
});

describe('RUT validation', () => {
  it('normalizes valid RUTs and validates the verifier', () => {
    expect(normalizeRut('12.345.678-5')).toBe('12345678-5');
    expect(isValidRut('12.345.678-5')).toBe(true);
    expect(isValidRut('12.345.678-9')).toBe(false);
    expect(isValidRut('')).toBe(false);
  });
});

describe('RUT caret positions', () => {
  it('places the caret after the same meaningful character', () => {
    expect(rutCaretPosition('12.345.678', 4)).toBe(5);
    expect(rutCaretPosition('12.345.678-5', 9)).toBe(12);
  });
});
