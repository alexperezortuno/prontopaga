import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { LoginUseCase } from '../application/login.use-case';
import { InvalidCredentialsError } from '../domain/auth.types';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  password!: string;
}

@Controller()
export class AuthController {
  constructor(private readonly login: LoginUseCase) {}

  @Post('login')
  async loginUser(@Body() body: LoginDto) {
    try {
      return await this.login.execute(body);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException('Invalid credentials');
      }
      throw error;
    }
  }
}
