import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const ORDER_URL = 'http://localhost:3003';

@Controller('orders')
export class OrderController {
  constructor(private readonly http: HttpService) {}

  @Get()
  async findAll() {
    const { data } = await firstValueFrom(this.http.get(`${ORDER_URL}/orders`));
    return data;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const { data } = await firstValueFrom(this.http.get(`${ORDER_URL}/orders/${id}`));
    return data;
  }

  @Post()
  async create(@Body() body: any) {
    const { data } = await firstValueFrom(this.http.post(`${ORDER_URL}/orders`, body));
    return data;
  }
}
