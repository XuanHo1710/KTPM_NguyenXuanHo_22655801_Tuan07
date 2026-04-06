import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FoodService } from './food.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';

@Controller()
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @MessagePattern('food.findAll')
  findAll() {
    return this.foodService.findAll();
  }

  @MessagePattern('food.findOne')
  findOne(@Payload() id: string) {
    return this.foodService.findOne(id);
  }

  @MessagePattern('food.create')
  create(@Payload() createFoodDto: CreateFoodDto) {
    return this.foodService.create(createFoodDto);
  }

  @MessagePattern('food.update')
  update(@Payload() data: { id: string; updateFoodDto: UpdateFoodDto }) {
    return this.foodService.update(data.id, data.updateFoodDto);
  }

  @MessagePattern('food.delete')
  remove(@Payload() id: string) {
    return this.foodService.remove(id);
  }
}
