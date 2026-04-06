import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentService } from './payment.service';

@Controller()
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Pattern: payment.create
   * Tạo thanh toán cho đơn hàng
   * Payload: { orderId: string, customerEmail: string, description?: string }
   */
  @MessagePattern('payment.create')
  async createPayment(
    @Payload() data: { orderId: string; customerEmail: string; description?: string },
  ) {
    this.logger.log(`Creating payment for order: ${data.orderId}`);
    return this.paymentService.createPayment(data);
  }

  /**
   * Pattern: payment.findAll
   * Lấy tất cả payments
   */
  @MessagePattern('payment.findAll')
  async findAll() {
    return this.paymentService.findAll();
  }

  /**
   * Pattern: payment.findByOrder
   * Lấy payment theo orderId
   */
  @MessagePattern('payment.findByOrder')
  async findByOrder(@Payload() orderId: string) {
    return this.paymentService.findByOrderId(orderId);
  }
}
