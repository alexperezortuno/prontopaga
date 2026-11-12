import { Rut } from '../../../shared/domain/rut';

export function calculateDeterministicScore(rut: Rut): number {
  let hash = 2166136261;

  for (const character of rut.canonical()) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  return hash % 101;
}
