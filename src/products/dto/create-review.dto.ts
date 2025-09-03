import { IsNotEmpty, IsNumber, IsString, Min, Max, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'Product ID', example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Rating (1-5)', example: 5, minimum: 1, maximum: 5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Review comment', example: 'Great product! Very satisfied with the quality.', minLength: 10, maxLength: 500 })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  comment: string;
}
