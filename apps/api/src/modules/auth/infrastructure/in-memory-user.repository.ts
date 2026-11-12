import { Injectable } from '@nestjs/common';
import { UserRepository } from '../application/ports/user-repository.port';
import { User } from '../domain/auth.types';

const MOCK_USERS: readonly User[] = [
  {
    id: 'user-admin-1',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
  },
  {
    id: 'user-demo-1',
    username: 'user',
    password: 'user123',
    role: 'user',
    rut: '12345678-5',
  },
];

@Injectable()
export class InMemoryUserRepository implements UserRepository {
  async findByUsername(username: string): Promise<User | undefined> {
    return MOCK_USERS.find((user) => user.username === username);
  }
}
