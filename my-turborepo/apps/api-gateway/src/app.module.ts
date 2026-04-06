import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { FoodController } from './controllers/food.controller';
import { OrderController } from './controllers/order.controller';
import { PaymentController } from './controllers/payment.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClientsModule.register([
      {
        name: 'FOOD_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3002 },
      },
      {
        name: 'ORDER_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3003 },
      },
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3004 },
      },
      {
        name: 'PAYMENT_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3005 },
      },
    ]),
  ],
  controllers: [FoodController, OrderController, PaymentController],
})
export class AppModule {}
