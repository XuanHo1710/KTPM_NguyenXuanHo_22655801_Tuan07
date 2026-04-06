import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User> & {
  createdAt: Date;
};

@Schema({
  collection: 'users',
  timestamps: true,
})
export class User {
  @Prop({ required: true, unique: true, trim: true })
  username!: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
