import { Injectable } from '@nestjs/common';
import { Rut } from '../../../shared/domain/rut';
import { calculateDeterministicScore } from '../domain/deterministic-score';

export interface ScoreOutput {
  readonly rut: string;
  readonly score: number;
  readonly fecha: string;
}

@Injectable()
export class GetScoreUseCase {
  execute(rawRut: string): ScoreOutput {
    const rut: Rut = Rut.create(rawRut);

    return {
      rut: rut.formatted(),
      score: calculateDeterministicScore(rut),
      fecha: new Date().toISOString(),
    };
  }
}
