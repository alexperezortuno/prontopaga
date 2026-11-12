import { User } from '../../domain/auth.types';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  findByUsername(username: string): Promise<User | undefined>;
}
