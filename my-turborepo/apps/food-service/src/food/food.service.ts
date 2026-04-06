import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Food, FoodDocument } from './schemas/food.schema';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';

@Injectable()
export class FoodService implements OnModuleInit {
  private readonly logger = new Logger(FoodService.name);

  constructor(@InjectModel(Food.name) private foodModel: Model<FoodDocument>) {}

  async onModuleInit() {
    await this.seed();
  }

  private async seed() {
    const count = await this.foodModel.countDocuments();
    if (count > 0) {
      this.logger.log(`Database already has ${count} foods, skipping seed.`);
      return;
    }

    const seedData = [
      { name: 'Phở Bò', price: 45000, description: 'Phở bò truyền thống Hà Nội với nước dùng đậm đà', category: 'Món nước' },
      { name: 'Bún Chả', price: 40000, description: 'Bún chả Hà Nội với thịt nướng than hoa', category: 'Món nước' },
      { name: 'Cơm Tấm Sườn', price: 35000, description: 'Cơm tấm sườn bì chả trứng ốp la', category: 'Cơm' },
      { name: 'Bánh Mì Thịt', price: 25000, description: 'Bánh mì thịt nguội pate đặc biệt', category: 'Ăn vặt' },
      { name: 'Gỏi Cuốn', price: 30000, description: 'Gỏi cuốn tôm thịt với nước chấm đậu phộng', category: 'Khai vị' },
      { name: 'Trà Sữa Trân Châu', price: 35000, description: 'Trà sữa truyền thống với trân châu đen', category: 'Đồ uống' },
      { name: 'Hủ Tiếu Nam Vang', price: 42000, description: 'Hủ tiếu Nam Vang với tôm, thịt, gan', category: 'Món nước' },
      { name: 'Bò Lúc Lắc', price: 65000, description: 'Bò lúc lắc xào với rau củ, ăn kèm cơm trắng', category: 'Món mặn' },
    ];

    await this.foodModel.insertMany(seedData);
    this.logger.log(`✅ Seeded ${seedData.length} foods into MongoDB`);
  }

  async findAll(): Promise<Food[]> {
    return this.foodModel.find().exec();
  }

  async findOne(id: string): Promise<Food> {
    const food = await this.foodModel.findById(id).exec();
    if (!food) {
      throw new NotFoundException(`Food with id ${id} not found`);
    }
    return food;
  }

  async create(createFoodDto: CreateFoodDto): Promise<Food> {
    const created = new this.foodModel(createFoodDto);
    return created.save();
  }

  async update(id: string, updateFoodDto: UpdateFoodDto): Promise<Food> {
    const updated = await this.foodModel
      .findByIdAndUpdate(id, updateFoodDto, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Food with id ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.foodModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Food with id ${id} not found`);
    }
    return { message: `Food with id ${id} has been deleted` };
  }
}
