import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthController } from './auth.controller';
import { UsersController } from './users.controller';
import { UserServiceProxy } from './user-service.proxy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController, AuthController, UsersController],
  providers: [UserServiceProxy],
})
export class AppModule {}
