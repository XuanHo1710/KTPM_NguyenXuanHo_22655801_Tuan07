import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const FOOD_URL = 'http://192.168.137.49:3002';

@Controller('foods')
export class FoodController {
  constructor(private readonly http: HttpService) {}

  @Get()
  async findAll() {
    const { data } = await firstValueFrom(this.http.get(`${FOOD_URL}/foods`));
    return data;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const { data } = await firstValueFrom(this.http.get(`${FOOD_URL}/foods/${id}`));
    return data;
  }

  @Post()
  async create(@Body() body: any) {
    const { data } = await firstValueFrom(this.http.post(`${FOOD_URL}/foods`, body));
    return data;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const { data } = await firstValueFrom(this.http.put(`${FOOD_URL}/foods/${id}`, body));
    return data;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const { data } = await firstValueFrom(this.http.delete(`${FOOD_URL}/foods/${id}`));
    return data;
  }
}
