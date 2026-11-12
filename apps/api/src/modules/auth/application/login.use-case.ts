import { Inject, Injectable } from '@nestjs/common';
import { AuthTokenClaims, InvalidCredentialsError } from '../domain/auth.types';
import { TOKEN_SERVICE, TokenService } from './ports/token-service.port';
import { USER_REPOSITORY, UserRepository } from './ports/user-repository.port';

export interface LoginInput {
  readonly username: string;
  readonly password: string;
}

export interface LoginOutput {
  readonly accessToken: string;
  readonly user: {
    readonly id: string;
    readonly username: string;
    readonly role: AuthTokenClaims['role'];
    readonly rut?: string;
  };
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.users.findByUsername(input.username);

    if (!user || user.password !== input.password) {
      throw new InvalidCredentialsError();
    }

    const claims: AuthTokenClaims = {
      sub: user.id,
      role: user.role,
      ...(user.role === 'user' && user.rut ? { rut: user.rut } : {}),
    };

    const accessToken = await this.tokens.sign(claims);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        ...(user.role === 'user' && user.rut ? { rut: user.rut } : {}),
      },
    };
  }
}
