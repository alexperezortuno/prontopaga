export type UserRole = 'admin' | 'user';

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsError';
  }
}

export interface User {
  readonly id: string;
  readonly username: string;
  readonly password: string;
  readonly role: UserRole;
  readonly rut?: string;
}

export interface AuthTokenClaims {
  readonly sub: string;
  readonly role: UserRole;
  readonly rut?: string;
}
