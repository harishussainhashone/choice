import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsArray, MinLength, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFaqDto {
  @ApiProperty({
    description: 'FAQ question',
    example: 'How do I place an order?',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Question must be at least 10 characters long' })
  @MaxLength(500, { message: 'Question must not exceed 500 characters' })
  question: string;

  @ApiProperty({
    description: 'FAQ answer',
    example: 'To place an order, simply browse our products, add items to your cart, and proceed to checkout.',
    minLength: 20,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20, { message: 'Answer must be at least 20 characters long' })
  @MaxLength(2000, { message: 'Answer must not exceed 2000 characters' })
  answer: string;

  @ApiProperty({
    description: 'Whether the FAQ is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Order for displaying FAQs',
    example: 1,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Order must be a positive number' })
  order?: number;

  @ApiProperty({
    description: 'Tags for categorizing FAQs',
    example: ['shipping', 'orders', 'payment'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
