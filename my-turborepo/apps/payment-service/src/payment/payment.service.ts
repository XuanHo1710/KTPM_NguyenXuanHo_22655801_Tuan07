import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Payment } from './entity/payment.entity';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PayOS } = require('@payos/node');

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly ORDER_SERVICE_URL = 'http://localhost:3003';
  private readonly NOTIFICATION_SERVICE_URL = 'http://localhost:3004';
  private payos: any;

  constructor(
    private configService: ConfigService,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    private readonly httpService: HttpService,
  ) {
    // Init PayOS with options object (v2)
    this.payos = new PayOS({
      clientId: this.configService.get<string>('PAYOS_CLIENTID') || '',
      apiKey: this.configService.get<string>('PAYOS_APIKEY') || '',
      checksumKey: this.configService.get<string>('PAYOS_CHECKSUM') || '',
    });
    this.logger.log('✅ PayOS initialized');
  }

  /**
   * Tạo link thanh toán PayOS thật
   */
  async createPayment(data: {
    orderId: string;
    customerEmail: string;
    description?: string;
  }) {
    // 1. Lấy thông tin order từ Order Service
    let orderInfo: any;
    try {
      const { data: order } = await firstValueFrom(
        this.httpService.get(`${this.ORDER_SERVICE_URL}/orders/${data.orderId}`),
      );
      orderInfo = order;
      this.logger.log(`✅ Order fetched: ${orderInfo._id} - Total: ${orderInfo.totalAmount}đ`);
    } catch {
      return {
        success: false,
        message: `Order với ID ${data.orderId} không tồn tại`,
      };
    }

    // 2. Tạo payment record (PENDING)
    const paymentCode = Date.now() % 1000000000; // PayOS yêu cầu orderCode là số nguyên
    const amount = Math.max(Math.round(orderInfo.totalAmount), 2000); // PayOS min 2000đ
    const description = data.description || `Don hang ${paymentCode}`;
    // PayOS description max 25 ký tự
    const shortDesc = description.substring(0, 25);

    const payment = await this.paymentModel.create({
      paymentCode,
      orderId: data.orderId,
      amount,
      status: 'PENDING',
      description: shortDesc,
      customerEmail: data.customerEmail,
      orderInfo: {
        userId: orderInfo.userId,
        userName: orderInfo.userName,
        items: orderInfo.items,
        totalAmount: orderInfo.totalAmount,
      },
    });

    this.logger.log(`💰 Payment ${paymentCode} created (PENDING) - Amount: ${amount}đ`);

    // 3. Tạo PayOS payment link
    const returnUrl = this.configService.get<string>('RETURN_URL') || 'http://localhost:3000/payment/info';
    const cancelUrl = returnUrl;

    try {
      const items = (orderInfo.items || []).map((item: any) => ({
        name: (item.foodName || 'Mon an').substring(0, 25),
        quantity: item.quantity || 1,
        price: Math.round(item.price || 0),
      }));

      const payosResponse = await this.payos.createPaymentLink({
        orderCode: paymentCode,
        amount,
        description: shortDesc,
        items: items.length > 0 ? items : [{ name: 'Don hang', quantity: 1, price: amount }],
        returnUrl,
        cancelUrl,
      });

      this.logger.log(`🔗 PayOS link created: ${payosResponse.checkoutUrl}`);

      return {
        success: true,
        message: 'Tạo link thanh toán thành công',
        data: {
          paymentId: (payment as any)._id.toString(),
          paymentCode,
          orderId: data.orderId,
          amount,
          status: 'PENDING',
          checkoutUrl: payosResponse.checkoutUrl,
          qrCode: payosResponse.qrCode,
        },
      };
    } catch (err: any) {
      this.logger.error(`❌ PayOS error: ${err.message}`);
      // Fallback: thanh toán trực tiếp không qua PayOS
      await this.paymentModel.findByIdAndUpdate((payment as any)._id, { status: 'PAID' });

      // Update order status
      try {
        await firstValueFrom(
          this.httpService.patch(`${this.ORDER_SERVICE_URL}/orders/${data.orderId}/status`, { status: 'PAID' }),
        );
      } catch { }

      // Send notification
      try {
        const notif = `User ${orderInfo.userName} da dat don #${data.orderId.substring(0, 8)} thanh cong`;
        await firstValueFrom(
          this.httpService.post(`${this.NOTIFICATION_SERVICE_URL}/notification/send`, {
            userId: orderInfo.userId, userName: orderInfo.userName, orderId: data.orderId, message: notif,
          }),
        );
      } catch { }

      return {
        success: true,
        message: 'Thanh toán thành công (direct)',
        data: {
          paymentId: (payment as any)._id.toString(),
          paymentCode, orderId: data.orderId, amount, status: 'PAID',
        },
      };
    }
  }

  /**
   * PayOS callback - xác nhận thanh toán
   */
  async handlePayosCallback(paymentCode: number) {
    try {
      const payosInfo = await this.payos.getPaymentLinkInformation(paymentCode);
      this.logger.log(`PayOS info for ${paymentCode}: status=${payosInfo.status}`);

      const payment = await this.paymentModel.findOne({ paymentCode });
      if (!payment) return { success: false, message: 'Payment not found' };

      if (payosInfo.status === 'PAID') {
        payment.status = 'PAID';
        payment.transactionId = payosInfo.id || '';
        await payment.save();

        // Update order → PAID
        try {
          await firstValueFrom(
            this.httpService.patch(`${this.ORDER_SERVICE_URL}/orders/${payment.orderId}/status`, { status: 'PAID' }),
          );
          this.logger.log(`✅ Order ${payment.orderId} → PAID`);
        } catch { }

        // Notification
        try {
          const notif = `User ${payment.orderInfo?.userName} da dat don #${payment.orderId.substring(0, 8)} thanh cong`;
          await firstValueFrom(
            this.httpService.post(`${this.NOTIFICATION_SERVICE_URL}/notification/send`, {
              userId: payment.orderInfo?.userId, userName: payment.orderInfo?.userName,
              orderId: payment.orderId, message: notif,
            }),
          );
          this.logger.log(`📢 Notification sent`);
        } catch { }

        return { success: true, message: 'Thanh toán thành công', status: 'PAID', payment };
      } else if (payosInfo.status === 'CANCELLED') {
        payment.status = 'UNPAID';
        await payment.save();
        return { success: false, message: 'Thanh toán bị hủy', status: 'CANCELLED' };
      }

      return { success: false, message: `Status: ${payosInfo.status}`, status: payosInfo.status };
    } catch (err: any) {
      this.logger.error(`PayOS callback error: ${err.message}`);
      return { success: false, message: err.message };
    }
  }

  async findAll() {
    return this.paymentModel.find().sort({ createdAt: -1 }).exec();
  }

  async findByOrderId(orderId: string) {
    return this.paymentModel.find({ orderId }).sort({ createdAt: -1 }).exec();
  }

  async findByPaymentCode(paymentCode: number) {
    return this.paymentModel.findOne({ paymentCode }).exec();
  }
}
