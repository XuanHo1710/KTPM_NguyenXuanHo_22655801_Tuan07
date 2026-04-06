import { Controller, Post, Get, Param, Body, Query, Logger } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  async createPayment(
    @Body() data: { orderId: string; customerEmail: string; description?: string },
  ) {
    this.logger.log(`Creating payment for order: ${data.orderId}`);
    return this.paymentService.createPayment(data);
  }

  @Get()
  async findAll() {
    return this.paymentService.findAll();
  }

  @Get('order/:orderId')
  async findByOrder(@Param('orderId') orderId: string) {
    return this.paymentService.findByOrderId(orderId);
  }

  /**
   * GET /payments/verify/:paymentCode
   * Xác nhận thanh toán PayOS (frontend gọi sau khi redirect về)
   */
  @Get('verify/:paymentCode')
  async verifyPayment(@Param('paymentCode') paymentCode: string) {
    this.logger.log(`Verifying payment: ${paymentCode}`);
    return this.paymentService.handlePayosCallback(parseInt(paymentCode));
  }
}
