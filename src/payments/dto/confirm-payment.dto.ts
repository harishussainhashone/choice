import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPaymentDto {
  @ApiProperty({ 
    description: 'Payment Intent ID (for Stripe)', 
    example: 'pi_1234567890',
    required: false
  })
  @IsOptional()
  @IsString()
  paymentIntentId?: string;

  @ApiProperty({ 
    description: 'PayPal Order ID (for PayPal)', 
    example: '399577640T4006649',
    required: false
  })
  @IsOptional()
  @IsString()
  paypalOrderId?: string;
}