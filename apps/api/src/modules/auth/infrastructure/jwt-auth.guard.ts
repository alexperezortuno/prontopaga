import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Inject } from '@nestjs/common';
import {
  TOKEN_SERVICE,
  TokenService,
} from '../application/ports/token-service.port';
import { AuthTokenClaims } from '../domain/auth.types';

export type AuthenticatedRequest = Request & {
  user: AuthTokenClaims;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication required');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    request.user = await this.tokens.verify(token);
    return true;
  }
}
