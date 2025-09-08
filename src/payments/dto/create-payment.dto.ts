import { IsNotEmpty, IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../schemas/payment.schema';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Order ID', example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty({ 
    description: 'Payment method', 
    enum: PaymentMethod,
    example: PaymentMethod.STRIPE 
  })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Payment amount', example: 99.99, minimum: 0.01 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Currency code', example: 'USD' })
  @IsNotEmpty()
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Success URL for redirect after payment', required: false })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiProperty({ description: 'Cancel URL for redirect if payment cancelled', required: false })
  @IsOptional()
  @IsString()
  cancelUrl?: string;
}
