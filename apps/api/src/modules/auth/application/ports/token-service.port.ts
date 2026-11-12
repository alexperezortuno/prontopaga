import { AuthTokenClaims } from '../../domain/auth.types';

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface TokenService {
  sign(claims: AuthTokenClaims): Promise<string>;
  verify(token: string): Promise<AuthTokenClaims>;
}
