import { Controller, Post, Get, Body, Query, Logger } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  /**
   * POST /payment/create
   * Tạo link thanh toán PayOS
   */
  @Post('create')
  async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    this.logger.log(`Creating payment: ${JSON.stringify(createPaymentDto)}`);
    const result = await this.paymentService.createPaymentUrl(createPaymentDto);
    return result;
  }

  /**
   * GET /payment/verify?orderCode=xxx&status=xxx
   * Xác thực thanh toán sau khi user quay lại từ PayOS
   */
  @Get('verify')
  async verifyPayment(
    @Query('orderCode') orderCode: string,
    @Query('status') status: string,
  ) {
    this.logger.log(`Verifying payment: orderCode=${orderCode}, status=${status}`);
    const result = await this.paymentService.verifyPayment(
      Number(orderCode),
      status,
    );
    return result;
  }

  /**
   * GET /payment/info?orderCode=xxx
   * Lấy thông tin payment theo orderCode
   */
  @Get('info')
  async getPaymentInfo(@Query('orderCode') orderCode: string) {
    const payment = await this.paymentService.getPaymentByOrderCode(Number(orderCode));
    if (!payment) {
      return {
        success: false,
        message: 'Không tìm thấy thông tin thanh toán',
      };
    }
    return {
      success: true,
      data: payment,
    };
  }

  /**
   * GET /payment/all
   * Lấy tất cả payments
   */
  @Get('all')
  async getAllPayments() {
    const payments = await this.paymentService.getAllPayments();
    return {
      success: true,
      data: payments,
    };
  }
}
