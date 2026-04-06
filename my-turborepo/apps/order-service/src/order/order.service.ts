import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @Inject('FOOD_SERVICE') private readonly foodClient: ClientProxy,
  ) {}

  async findAll(): Promise<Order[]> {
    return this.orderModel.find().exec();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return order;
  }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    // Lấy thông tin từng món ăn từ Food Service qua TCP
    const orderItems: Array<{
      foodId: string;
      foodName: string;
      price: number;
      quantity: number;
      subtotal: number;
    }> = [];

    for (const item of createOrderDto.items) {
      try {
        const food = await firstValueFrom(
          this.foodClient.send('food.findOne', item.foodId).pipe(
            timeout(5000),
            catchError((err) => {
              this.logger.error(`Food Service error: ${err.message}`);
              throw new BadRequestException(
                `Food with id ${item.foodId} not found or Food Service unavailable`,
              );
            }),
          ),
        );

        orderItems.push({
          foodId: food._id || food.id,
          foodName: food.name,
          price: food.price,
          quantity: item.quantity,
          subtotal: food.price * item.quantity,
        });

        this.logger.log(
          `✅ Food fetched via TCP: ${food.name} x${item.quantity} = ${food.price * item.quantity}đ`,
        );
      } catch (error) {
        if (error instanceof BadRequestException) throw error;
        throw new BadRequestException(
          `Food with id ${item.foodId} not found`,
        );
      }
    }

    // Tính tổng tiền và lưu order
    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );

    const created = new this.orderModel({
      userId: createOrderDto.userId,
      userName: `User #${createOrderDto.userId}`,
      items: orderItems,
      totalAmount,
      status: 'PENDING',
    });

    const saved = await created.save();
    this.logger.log(
      `🛒 Order ${saved._id} created - Total: ${totalAmount}đ`,
    );
    return saved;
  }

  async updateStatus(orderId: string, status: string): Promise<Order> {
    const order = await this.orderModel
      .findByIdAndUpdate(orderId, { status }, { new: true })
      .exec();
    if (!order) {
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }
    this.logger.log(`📋 Order ${orderId} status updated to: ${status}`);
    return order;
  }
}
