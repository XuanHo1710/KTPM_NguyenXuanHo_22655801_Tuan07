import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FoodDocument = HydratedDocument<Food>;

@Schema({ timestamps: true })
export class Food {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: 'Khác' })
  category: string;
}

export const FoodSchema = SchemaFactory.createForClass(Food);
