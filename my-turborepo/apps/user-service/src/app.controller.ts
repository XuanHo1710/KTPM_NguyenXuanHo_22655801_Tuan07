import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('register')
  register(@Body() body: { username?: string; email?: string; password?: string }) {
    return this.appService.register(body);
  }

  @Post('login')
  login(@Body() body: { identifier?: string; password?: string }) {
    return this.appService.login(body);
  }

  @Get('users')
  getUsers(@Headers('authorization') authorization?: string) {
    return this.appService.getUsers(authorization);
  }

  @Get('users/:id')
  findOne(@Param('id') id: string) {
    return this.appService.findOne(id);
  }
}
