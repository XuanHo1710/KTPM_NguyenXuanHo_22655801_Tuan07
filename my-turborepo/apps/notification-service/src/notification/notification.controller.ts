import { Controller, Post, Body, Logger } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(private readonly notificationService: NotificationService) {}

  /**
   * POST /notification/send-payment-confirmation
   * Nhận request từ payment-service sau khi thanh toán thành công
   * Gửi email xác nhận thanh toán qua Brevo
   */
  @Post('send-payment-confirmation')
  async sendPaymentConfirmation(
    @Body()
    data: {
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
      data.email,
      data.paymentCode,
      data.amount,
      data.description,
      data.transactionId,
      data.paidAt,
    );

    return {
      success: result,
      message: result
        ? 'Email xác nhận thanh toán đã được gửi thành công'
        : 'Gửi email thất bại',
    };
  }

  /**
   * POST /notification/send-mail
   * Gửi email thông thường
   */
  @Post('send-mail')
  async sendMail(
    @Body()
    data: {
      email: string;
      subject: string;
      content: string;
    },
  ) {
    this.logger.log(`Sending mail to: ${data.email}`);

    const result = await this.notificationService.sendCustomEmail(
      data.email,
      data.subject,
      data.content,
    );

    return {
      success: result,
      message: result ? 'Email đã được gửi thành công' : 'Gửi email thất bại',
    };
  }
}
