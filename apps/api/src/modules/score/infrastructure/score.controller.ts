import {
  Controller,
  BadRequestException,
  ForbiddenException,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedRequest, JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/roles.guard';
import { GetScoreUseCase } from '../application/get-score.use-case';
import { InvalidRutError, Rut } from '../../../shared/domain/rut';

@Controller('score')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScoreController {
  constructor(private readonly getScore: GetScoreUseCase) {}

  @Get(':rut')
  get(@Param('rut') rawRut: string, @Req() request: AuthenticatedRequest) {
    let requestedRut: Rut;
    try {
      requestedRut = Rut.create(rawRut);
    } catch (error) {
      if (error instanceof InvalidRutError) {
        throw new BadRequestException('Invalid RUT');
      }
      throw error;
    }

    if (request.user.role === 'user') {
      if (!request.user.rut || requestedRut.canonical() !== request.user.rut) {
        throw new ForbiddenException('You can only consult your own RUT');
      }
    }

    return this.getScore.execute(requestedRut.canonical());
  }
}
