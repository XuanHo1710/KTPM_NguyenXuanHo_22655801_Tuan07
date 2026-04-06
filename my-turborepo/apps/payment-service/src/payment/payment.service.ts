import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PayOS } from '@payos/node';
import { Payment } from './entity/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private clientID: string;
  private apiKey: string;
  private checkSum: string;
  private returnUrl: string;
  private notificationServiceUrl: string;

  constructor(
    private configService: ConfigService,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
  ) {
    this.clientID = this.configService.get<string>('PAYOS_CLIENTID') || '';
    this.apiKey = this.configService.get<string>('PAYOS_APIKEY') || '';
    this.checkSum = this.configService.get<string>('PAYOS_CHECKSUM') || '';
    this.returnUrl = this.configService.get<string>('RETURN_URL') || 'http://localhost:3000/payment/info';
    this.notificationServiceUrl = this.configService.get<string>('NOTIFICATION_SERVICE_URL') || 'http://localhost:3004';
  }

  private createPayOS() {
    return new PayOS({
      clientId: this.clientID,
      apiKey: this.apiKey,
      checksumKey: this.checkSum,
    });
  }

  /**
   * Tạo link thanh toán PayOS (thanh toán tiền thật)
   */
  async createPaymentUrl(createPaymentDto: CreatePaymentDto) {
    const payos = this.createPayOS();

    const paymentCode: number = Date.now();
    const description = createPaymentDto.description || `Don hang ${paymentCode}`;

    const paymentLink = await payos.paymentRequests.create(
      {
        orderCode: paymentCode,
        amount: createPaymentDto.amount,
        expiredAt: Math.floor(Date.now() / 1000) + 15 * 60, // 15 phút
        description: description.substring(0, 25), // PayOS giới hạn 25 ký tự
        returnUrl: this.returnUrl,
        cancelUrl: this.returnUrl,
      },
      {
        maxRetries: 5,
        timeout: 10000,
      },
    );

    // Lưu payment record với status PENDING
    const payment = await this.paymentModel.create({
      paymentCode: paymentCode,
      amount: createPaymentDto.amount,
      status: 'PENDING',
      transactionId: paymentLink.paymentLinkId || '',
      paymentAttempt: 1,
      description: createPaymentDto.description || '',
      customerEmail: createPaymentDto.customerEmail,
    });

    this.logger.log(`Payment created: ${paymentCode} - Amount: ${createPaymentDto.amount} VND`);

    return {
      url: paymentLink.checkoutUrl,
      orderCode: paymentCode,
      paymentId: payment._id.toString(),
    };
  }

  /**
   * Xác thực thanh toán từ PayOS return URL
   * Nếu thành công → gọi notification-service gửi email
   */
  async verifyPayment(orderCode: number, status: string) {
    try {
      const payos = this.createPayOS();

      // Lấy thông tin thanh toán từ PayOS
      const paymentLinkInfo = await payos.paymentRequests.get(orderCode);

      const payment = await this.paymentModel.findOne({
        paymentCode: orderCode,
      });

      if (!payment) {
        return {
          success: false,
          message: 'Không tìm thấy thông tin thanh toán',
        };
      }

      if (paymentLinkInfo.status === 'PAID') {
        // Cập nhật payment status thành PAID
        payment.status = 'PAID';
        payment.transactionId =
          paymentLinkInfo.transactions?.[0]?.reference || payment.transactionId;
        await payment.save();

        this.logger.log(`Payment ${orderCode} PAID successfully`);

        // Gọi notification-service gửi email thông báo
        this.sendNotification(payment).catch((err) =>
          this.logger.error(`Notification error: ${err.message}`),
        );

        return {
          success: true,
          message: 'Thanh toán thành công',
          data: {
            paymentCode: payment.paymentCode,
            amount: payment.amount,
            status: payment.status,
            transactionId: payment.transactionId,
            paidAt: paymentLinkInfo.transactions?.[0]?.transactionDateTime || null,
          },
        };
      } else if (
        paymentLinkInfo.status === 'CANCELLED' ||
        paymentLinkInfo.status === 'EXPIRED'
      ) {
        payment.status = 'UNPAID';
        await payment.save();

        return {
          success: false,
          message:
            paymentLinkInfo.status === 'CANCELLED'
              ? 'Thanh toán đã bị hủy'
              : 'Thanh toán đã hết hạn',
          data: {
            paymentCode: payment.paymentCode,
            amount: payment.amount,
            status: payment.status,
          },
        };
      } else {
        // PENDING hoặc PROCESSING
        return {
          success: false,
          message: 'Thanh toán đang được xử lý',
          data: {
            paymentCode: payment.paymentCode,
            amount: payment.amount,
            status: paymentLinkInfo.status,
          },
        };
      }
    } catch (error) {
      this.logger.error('Payment verification error:', error);

      // Cập nhật trạng thái UNPAID nếu verify thất bại
      try {
        const failedPayment = await this.paymentModel.findOne({
          paymentCode: orderCode,
          status: 'PENDING',
        });
        if (failedPayment) {
          failedPayment.status = 'UNPAID';
          await failedPayment.save();
          this.logger.log(`Payment ${orderCode} marked as UNPAID due to verification error`);
        }
      } catch (updateErr) {
        this.logger.error('Failed to update payment status on error:', updateErr);
      }

      return {
        success: false,
        message: 'Lỗi xác thực thanh toán',
      };
    }
  }

  /**
   * Lấy thông tin payment theo orderCode
   */
  async getPaymentByOrderCode(orderCode: number) {
    return await this.paymentModel.findOne({ paymentCode: orderCode });
  }

  /**
   * Lấy tất cả payments
   */
  async getAllPayments() {
    return await this.paymentModel.find().sort({ createdAt: -1 });
  }

  /**
   * Gọi HTTP đến notification-service để gửi email xác nhận thanh toán
   */
  private async sendNotification(payment: Payment) {
    const url = `${this.notificationServiceUrl}/notification/send-payment-confirmation`;
    const body = {
      email: payment.customerEmail,
      paymentCode: payment.paymentCode,
      amount: payment.amount,
      description: payment.description,
      transactionId: payment.transactionId,
      paidAt: new Date().toISOString(),
    };

    this.logger.log(`Sending notification to: ${url}`);
    this.logger.log(`Notification payload: ${JSON.stringify(body)}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notification service error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    this.logger.log(`Notification sent successfully: ${JSON.stringify(result)}`);
    return result;
  }
}
