import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(private readonly notificationService: NotificationService) {}

  @MessagePattern('notification.sendPaymentConfirmation')
  async sendPaymentConfirmation(
    @Payload()
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

  @MessagePattern('notification.sendMail')
  async sendMail(
    @Payload()
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

  @MessagePattern('notification.send')
  async sendNotification(
    @Payload()
    data: {
      userId: number;
      userName: string;
      orderId: string;
      message: string;
    },
  ) {
    this.logger.log(`📢 NOTIFICATION: ${data.message}`);
    this.logger.log(`   User: ${data.userName} (ID: ${data.userId})`);
    this.logger.log(`   Order: #${data.orderId}`);

    return {
      success: true,
      message: data.message,
    };
  }
}
