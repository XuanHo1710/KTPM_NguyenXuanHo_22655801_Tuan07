import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @MessagePattern('order.findAll')
  findAll() {
    return this.orderService.findAll();
  }

  @MessagePattern('order.findOne')
  findOne(@Payload() id: string) {
    return this.orderService.findOne(id);
  }

  @MessagePattern('order.create')
  create(@Payload() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @MessagePattern('order.updateStatus')
  updateStatus(@Payload() data: { orderId: string; status: string }) {
    return this.orderService.updateStatus(data.orderId, data.status);
  }
}
