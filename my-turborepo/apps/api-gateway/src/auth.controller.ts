import { Body, Controller, Post } from '@nestjs/common';
import { UserServiceProxy } from './user-service.proxy';

type RegisterBody = {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
};

type LoginBody = {
  email?: string;
  identifier?: string;
  username?: string;
  password?: string;
};

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly userServiceProxy: UserServiceProxy) {}

  @Post('register')
  register(@Body() body: RegisterBody) {
    const username = body.name?.trim() || body.username?.trim();

    return this.userServiceProxy.post('/register', {
      username,
      email: body.email,
      password: body.password,
    });
  }

  @Post('login')
  login(@Body() body: LoginBody) {
    const identifier =
      body.email?.trim() || body.identifier?.trim() || body.username?.trim();

    return this.userServiceProxy.post('/login', {
      identifier,
      password: body.password,
    });
  }
}
