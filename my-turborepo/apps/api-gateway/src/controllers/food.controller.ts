import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

@Controller('foods')
export class FoodController {
  constructor(
    @Inject('FOOD_SERVICE') private readonly foodClient: ClientProxy,
  ) {}

  @Get()
  async findAll() {
    return firstValueFrom(
      this.foodClient.send('food.findAll', {}).pipe(timeout(5000)),
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.foodClient.send('food.findOne', id).pipe(timeout(5000)),
    );
  }

  @Post()
  async create(@Body() body: any) {
    return firstValueFrom(
      this.foodClient.send('food.create', body).pipe(timeout(5000)),
    );
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(
      this.foodClient
        .send('food.update', { id, updateFoodDto: body })
        .pipe(timeout(5000)),
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return firstValueFrom(
      this.foodClient.send('food.delete', id).pipe(timeout(5000)),
    );
  }
}
