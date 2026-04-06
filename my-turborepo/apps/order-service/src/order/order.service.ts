import {
  Injectable,
  BadRequestException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  private readonly FOOD_SERVICE_URL = 'http://localhost:3002';
  private readonly USER_SERVICE_URL = 'http://localhost:3001';

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly httpService: HttpService,
  ) {}

  async findAll(): Promise<Order[]> {
    return this.orderModel.find().exec();
  }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    // 1. Validate user bằng cách gọi User Service
    let userName = 'Unknown User';
    try {
      const userResponse = await firstValueFrom(
        this.httpService.get(
          `${this.USER_SERVICE_URL}/users/${createOrderDto.userId}`,
        ),
      );
      userName = userResponse.data.name || userResponse.data.username || 'User';
      this.logger.log(
        `✅ User validated: ${userName} (ID: ${createOrderDto.userId})`,
      );
    } catch (error) {
      if (error?.response?.status === 404) {
        throw new BadRequestException(
          `User with id ${createOrderDto.userId} not found`,
        );
      }
      this.logger.warn(
        `⚠️ User Service unavailable, proceeding with userId: ${createOrderDto.userId}`,
      );
      userName = `User #${createOrderDto.userId}`;
    }

    // 2. Lấy thông tin từng món ăn từ Food Service
    const orderItems: Array<{
      foodId: string;
      foodName: string;
      price: number;
      quantity: number;
      subtotal: number;
    }> = [];
    for (const item of createOrderDto.items) {
      try {
        const foodResponse = await firstValueFrom(
          this.httpService.get(
            `${this.FOOD_SERVICE_URL}/foods/${item.foodId}`,
          ),
        );
        const food = foodResponse.data;
        orderItems.push({
          foodId: food._id || food.id,
          foodName: food.name,
          price: food.price,
          quantity: item.quantity,
          subtotal: food.price * item.quantity,
        });
        this.logger.log(
          `✅ Food fetched: ${food.name} x${item.quantity} = ${food.price * item.quantity}đ`,
        );
      } catch (error) {
        if (error?.response?.status === 404) {
          throw new BadRequestException(
            `Food with id ${item.foodId} not found`,
          );
        }
        throw new HttpException('Food Service is unavailable', 503);
      }
    }

    // 3. Tính tổng tiền và lưu order vào MongoDB
    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );

    const created = new this.orderModel({
      userId: createOrderDto.userId,
      userName,
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
}
