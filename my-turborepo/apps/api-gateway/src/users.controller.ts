import { Controller, Get, Headers } from '@nestjs/common';
import { UserServiceProxy } from './user-service.proxy';

@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly userServiceProxy: UserServiceProxy) {}

  @Get()
  getUsers(@Headers('authorization') authorization?: string) {
    return this.userServiceProxy.get('/users',
      authorization ? { authorization } : {},
    );
  }
}
