import { Rut } from '../../../shared/domain/rut';
import { calculateDeterministicScore } from './deterministic-score';

describe('calculateDeterministicScore', () => {
  it('returns the same score for the same canonical RUT', () => {
    const first = calculateDeterministicScore(Rut.create('12.345.678-5'));
    const second = calculateDeterministicScore(Rut.create('12345678-5'));

    expect(first).toBe(second);
  });

  it('returns an integer between 0 and 100', () => {
    const score = calculateDeterministicScore(Rut.create('12.345.678-5'));

    expect(Number.isInteger(score)).toBe(true);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
