import { Controller, Post, Body, Logger } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(private readonly notificationService: NotificationService) {}

  @Post('send-payment-confirmation')
  async sendPaymentConfirmation(
    @Body() data: {
      email: string;
      paymentCode: number;
      amount: number;
      description?: string;
      transactionId?: string;
      paidAt?: string;
    },
  ) {
    this.logger.log(`Received payment confirmation request: ${JSON.stringify(data)}`);
    const result = await this.notificationService.sendPaymentConfirmationEmail(
      data.email, data.paymentCode, data.amount, data.description, data.transactionId, data.paidAt,
    );
    return { success: result, message: result ? 'Email đã gửi thành công' : 'Gửi email thất bại' };
  }

  @Post('send')
  async sendNotification(
    @Body() data: { userId: number; userName: string; orderId: string; message: string },
  ) {
    this.logger.log(`📢 NOTIFICATION: ${data.message}`);
    this.logger.log(`   User: ${data.userName} (ID: ${data.userId})`);
    this.logger.log(`   Order: #${data.orderId}`);
    return { success: true, message: data.message };
  }
}
