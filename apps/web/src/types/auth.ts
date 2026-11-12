export type UserRole = 'admin' | 'user';

export interface SessionUser {
  readonly id: string;
  readonly username: string;
  readonly role: UserRole;
  readonly rut?: string;
}

export interface LoginResponse {
  readonly accessToken: string;
  readonly user: SessionUser;
}

export interface LoginInput {
  readonly username: string;
  readonly password: string;
}
