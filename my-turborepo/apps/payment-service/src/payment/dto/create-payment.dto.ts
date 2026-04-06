import { IsNotEmpty, IsNumber, IsEmail, IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber({}, { message: 'Số tiền phải là một số' })
  @IsNotEmpty({ message: 'Số tiền không được để trống' })
  amount: number;

  @IsString({ message: 'Mô tả phải là chuỗi' })
  @IsOptional()
  description?: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  customerEmail: string;
}
