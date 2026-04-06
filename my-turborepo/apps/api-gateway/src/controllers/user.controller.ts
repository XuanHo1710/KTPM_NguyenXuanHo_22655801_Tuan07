import { Controller, Get, Post, Body, Headers } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const USER_URL = 'http://192.168.137.49:3001';

@Controller('users')
export class UserController {
  constructor(private readonly http: HttpService) {}

  @Post('register')
  async register(@Body() body: any) {
    const { data } = await firstValueFrom(
      this.http.post(`${USER_URL}/register`, body),
    );
    return data;
  }

  @Post('login')
  async login(@Body() body: any) {
    const { data } = await firstValueFrom(
      this.http.post(`${USER_URL}/login`, body),
    );
    return data;
  }

  @Get()
  async getUsers(@Headers('authorization') auth?: string) {
    const headers: any = {};
    if (auth) headers['authorization'] = auth;
    const { data } = await firstValueFrom(
      this.http.get(`${USER_URL}/users`, { headers }),
    );
    return data;
  }
}
