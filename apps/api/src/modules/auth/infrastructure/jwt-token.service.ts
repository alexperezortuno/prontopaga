import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthTokenClaims } from '../domain/auth.types';
import { TokenService } from '../application/ports/token-service.port';

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwt: JwtService) {}

  sign(claims: AuthTokenClaims): Promise<string> {
    return this.jwt.signAsync(claims, { algorithm: 'HS256' });
  }

  async verify(token: string): Promise<AuthTokenClaims> {
    try {
      return await this.jwt.verifyAsync<AuthTokenClaims>(token, {
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
}
