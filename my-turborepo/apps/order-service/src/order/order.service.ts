import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
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

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly httpService: HttpService,
  ) {}

  async findAll(): Promise<Order[]> {
    return this.orderModel.find().exec();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const orderItems: Array<{
      foodId: string; foodName: string; price: number; quantity: number; subtotal: number;
    }> = [];

    for (const item of createOrderDto.items) {
      try {
        const { data: food } = await firstValueFrom(
          this.httpService.get(`${this.FOOD_SERVICE_URL}/foods/${item.foodId}`),
        );

        orderItems.push({
          foodId: food._id || food.id,
          foodName: food.name,
          price: food.price,
          quantity: item.quantity,
          subtotal: food.price * item.quantity,
        });

        this.logger.log(`✅ Food fetched: ${food.name} x${item.quantity} = ${food.price * item.quantity}đ`);
      } catch {
        throw new BadRequestException(`Food with id ${item.foodId} not found`);
      }
    }

    const totalAmount = orderItems.reduce((sum, i) => sum + i.subtotal, 0);

    const created = new this.orderModel({
      userId: createOrderDto.userId,
      userName: `User #${createOrderDto.userId}`,
      items: orderItems,
      totalAmount,
      status: 'PENDING',
    });

    const saved = await created.save();
    this.logger.log(`🛒 Order ${saved._id} created - Total: ${totalAmount}đ`);
    return saved;
  }

  async updateStatus(orderId: string, status: string): Promise<Order> {
    const order = await this.orderModel.findByIdAndUpdate(orderId, { status }, { new: true }).exec();
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    this.logger.log(`📋 Order ${orderId} status → ${status}`);
    return order;
  }
}
