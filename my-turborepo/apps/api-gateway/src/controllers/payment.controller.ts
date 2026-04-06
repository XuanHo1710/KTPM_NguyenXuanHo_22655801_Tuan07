import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

@Controller('payments')
export class PaymentController {
  constructor(
    @Inject('PAYMENT_SERVICE') private readonly paymentClient: ClientProxy,
  ) {}

  /**
   * POST /api/v1/payments
   * Tạo thanh toán cho đơn hàng
   * Body: { orderId: string, customerEmail: string, description?: string }
   */
  @Post()
  async create(@Body() body: any) {
    return firstValueFrom(
      this.paymentClient.send('payment.create', body).pipe(timeout(10000)),
    );
  }

  /**
   * GET /api/v1/payments
   * Lấy tất cả payments
   */
  @Get()
  async findAll() {
    return firstValueFrom(
      this.paymentClient.send('payment.findAll', {}).pipe(timeout(5000)),
    );
  }

  /**
   * GET /api/v1/payments/order/:orderId
   * Lấy payments theo orderId
   */
  @Get('order/:orderId')
  async findByOrder(@Param('orderId') orderId: string) {
    return firstValueFrom(
      this.paymentClient.send('payment.findByOrder', orderId).pipe(timeout(5000)),
    );
  }
}
