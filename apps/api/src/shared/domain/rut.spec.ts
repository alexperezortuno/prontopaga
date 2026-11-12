import { InvalidRutError, Rut } from './rut';

describe('Rut', () => {
  it('normalizes equivalent representations', () => {
    expect(Rut.create('12.345.678-5').canonical()).toBe('12345678-5');
    expect(Rut.create('12345678-5').formatted()).toBe('12.345.678-5');
  });

  it('normalizes a lowercase K verifier', () => {
    expect(Rut.create('1.000.005-k').canonical()).toBe('1000005-K');
  });

  it('rejects an invalid verifier', () => {
    expect(() => Rut.create('12.345.678-9')).toThrow(InvalidRutError);
  });
});
