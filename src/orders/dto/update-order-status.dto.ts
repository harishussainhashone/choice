import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from '../schemas/order.schema';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'New order status',
    enum: OrderStatus,
    example: OrderStatus.CONFIRMED,
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({
    description: 'Payment status',
    example: 'paid',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @ApiProperty({
    description: 'Additional notes for status update',
    example: 'Order confirmed and payment received',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
