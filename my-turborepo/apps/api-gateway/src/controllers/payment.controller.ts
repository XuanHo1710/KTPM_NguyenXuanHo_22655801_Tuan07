import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const PAYMENT_URL = 'http://localhost:3005';

@Controller('payments')
export class PaymentController {
  constructor(private readonly http: HttpService) {}

  @Post()
  async create(@Body() body: any) {
    const { data } = await firstValueFrom(this.http.post(`${PAYMENT_URL}/payments`, body));
    return data;
  }

  @Get()
  async findAll() {
    const { data } = await firstValueFrom(this.http.get(`${PAYMENT_URL}/payments`));
    return data;
  }

  @Get('order/:orderId')
  async findByOrder(@Param('orderId') orderId: string) {
    const { data } = await firstValueFrom(this.http.get(`${PAYMENT_URL}/payments/order/${orderId}`));
    return data;
  }

  @Get('verify/:paymentCode')
  async verify(@Param('paymentCode') paymentCode: string) {
    const { data } = await firstValueFrom(this.http.get(`${PAYMENT_URL}/payments/verify/${paymentCode}`));
    return data;
  }
}
