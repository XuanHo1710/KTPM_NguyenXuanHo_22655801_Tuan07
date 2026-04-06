import { IsNotEmpty, IsNumber, IsEmail, IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsString({ message: 'Order ID phải là chuỗi' })
  @IsNotEmpty({ message: 'Order ID không được để trống' })
  orderId: string;

  @IsNumber({}, { message: 'Số tiền phải là một số' })
  @IsOptional()
  amount?: number;

  @IsString({ message: 'Mô tả phải là chuỗi' })
  @IsOptional()
  description?: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  customerEmail: string;
}
