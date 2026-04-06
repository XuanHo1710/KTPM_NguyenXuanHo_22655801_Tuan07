import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { Payment } from './entity/payment.entity';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private configService: ConfigService,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @Inject('ORDER_SERVICE') private readonly orderClient: ClientProxy,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
  ) {}

  /**
   * Tạo thanh toán:
   * 1. Lấy order từ Order Service qua TCP
   * 2. Lưu payment record
   * 3. Update trạng thái order → PAID
   * 4. Gửi notification
   */
  async createPayment(data: {
    orderId: string;
    customerEmail: string;
    description?: string;
  }) {
    // 1. Lấy thông tin order từ Order Service qua TCP
    let orderInfo: any;
    try {
      orderInfo = await firstValueFrom(
        this.orderClient.send('order.findOne', data.orderId).pipe(
          timeout(5000),
          catchError((err) => {
            this.logger.error(`Order Service error: ${err.message}`);
            throw new Error(`Order với ID ${data.orderId} không tồn tại hoặc Order Service không khả dụng`);
          }),
        ),
      );
      this.logger.log(`✅ Order fetched via TCP: ${orderInfo._id} - Total: ${orderInfo.totalAmount}đ`);
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Không thể lấy thông tin order',
      };
    }

    // 2. Lưu payment record
    const paymentCode = Date.now();
    const payment = await this.paymentModel.create({
      paymentCode,
      orderId: data.orderId,
      amount: orderInfo.totalAmount,
      status: 'PAID',
      description: data.description || `Thanh toán đơn hàng #${data.orderId.substring(0, 8)}`,
      customerEmail: data.customerEmail,
      orderInfo: {
        userId: orderInfo.userId,
        userName: orderInfo.userName,
        items: orderInfo.items,
        totalAmount: orderInfo.totalAmount,
      },
    });

    this.logger.log(`💰 Payment ${paymentCode} created - Amount: ${orderInfo.totalAmount}đ`);

    // 3. Update trạng thái order → PAID qua TCP
    try {
      await firstValueFrom(
        this.orderClient.send('order.updateStatus', {
          orderId: data.orderId,
          status: 'PAID',
        }).pipe(timeout(5000)),
      );
      this.logger.log(`✅ Order ${data.orderId} status updated to PAID`);
    } catch (err) {
      this.logger.error(`⚠️ Failed to update order status: ${err.message}`);
    }

    // 4. Gửi notification qua TCP
    try {
      const notifMessage = `User ${orderInfo.userName} đã đặt đơn #${data.orderId.substring(0, 8)} thành công`;
      await firstValueFrom(
        this.notificationClient.send('notification.send', {
          userId: orderInfo.userId,
          userName: orderInfo.userName,
          orderId: data.orderId,
          message: notifMessage,
        }).pipe(timeout(5000)),
      );
      this.logger.log(`📢 Notification sent: ${notifMessage}`);
    } catch (err) {
      this.logger.error(`⚠️ Failed to send notification: ${err.message}`);
    }

    return {
      success: true,
      message: 'Thanh toán thành công',
      data: {
        paymentId: (payment as any)._id.toString(),
        paymentCode,
        orderId: data.orderId,
        amount: orderInfo.totalAmount,
        status: 'PAID',
        userName: orderInfo.userName,
        items: orderInfo.items,
      },
    };
  }

  async findAll() {
    return this.paymentModel.find().sort({ createdAt: -1 }).exec();
  }

  async findByOrderId(orderId: string) {
    return this.paymentModel.find({ orderId }).sort({ createdAt: -1 }).exec();
  }
}
