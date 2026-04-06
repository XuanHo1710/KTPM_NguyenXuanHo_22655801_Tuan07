import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

@Controller('orders')
export class OrderController {
  constructor(
    @Inject('ORDER_SERVICE') private readonly orderClient: ClientProxy,
  ) {}

  @Get()
  async findAll() {
    return firstValueFrom(
      this.orderClient.send('order.findAll', {}).pipe(timeout(5000)),
    );
  }

  @Post()
  async create(@Body() body: any) {
    return firstValueFrom(
      this.orderClient.send('order.create', body).pipe(timeout(5000)),
    );
  }
}
