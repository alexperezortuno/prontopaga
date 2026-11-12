import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './modules/auth/infrastructure/auth.controller';
import { InMemoryUserRepository } from './modules/auth/infrastructure/in-memory-user.repository';
import { JwtAuthGuard } from './modules/auth/infrastructure/jwt-auth.guard';
import { JwtTokenService } from './modules/auth/infrastructure/jwt-token.service';
import { RolesGuard } from './modules/auth/infrastructure/roles.guard';
import { LoginUseCase } from './modules/auth/application/login.use-case';
import { TOKEN_SERVICE } from './modules/auth/application/ports/token-service.port';
import { USER_REPOSITORY } from './modules/auth/application/ports/user-repository.port';
import { GetScoreUseCase } from './modules/score/application/get-score.use-case';
import { ScoreController } from './modules/score/infrastructure/score.controller';

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (
    !secret ||
    secret === 'replace-with-a-local-development-secret' ||
    secret.length < 32
  ) {
    throw new Error('JWT_SECRET must be configured');
  }
  return secret;
}

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: jwtSecret(),
        signOptions: { algorithm: 'HS256', expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController, ScoreController],
  providers: [
    LoginUseCase,
    GetScoreUseCase,
    InMemoryUserRepository,
    JwtTokenService,
    JwtAuthGuard,
    RolesGuard,
    { provide: USER_REPOSITORY, useExisting: InMemoryUserRepository },
    { provide: TOKEN_SERVICE, useExisting: JwtTokenService },
  ],
})
export class AppModule {}
