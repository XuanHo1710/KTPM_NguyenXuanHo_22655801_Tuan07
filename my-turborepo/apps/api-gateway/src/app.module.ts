import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { UserController } from './controllers/user.controller';
import { FoodController } from './controllers/food.controller';
import { OrderController } from './controllers/order.controller';
import { PaymentController } from './controllers/payment.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
  ],
  controllers: [UserController, FoodController, OrderController, PaymentController],
})
export class AppModule {}
