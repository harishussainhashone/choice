import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsArray, IsOptional, IsBoolean, Min, IsUrl } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'The name of the product',
    example: 'iPhone 15 Pro',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The description of the product',
    example: 'Latest iPhone with advanced camera features',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Brief summary of the product',
    example: 'Premium smartphone with advanced camera',
  })
  @IsString()
  @IsNotEmpty()
  shortDescription: string;

  @ApiProperty({
    description: 'Additional product information (key-value pairs)',
    example: {
      'Color': 'Titanium',
      'Storage': '256GB',
      'Screen Size': '6.1 inches',
      'Battery': '4000mAh'
    },
    required: false,
  })
  @IsOptional()
  additionalInfo?: Record<string, any>;

  @ApiProperty({
    description: 'The price of the product',
    example: 999.99,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'The category ID of the product',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    description: 'The thumbnail image URL of the product',
    example: 'https://example.com/images/iphone15-thumbnail.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  thumbnail: string;

  @ApiProperty({
    description: 'Array of additional image URLs',
    example: [
      'https://example.com/images/iphone15-1.jpg',
      'https://example.com/images/iphone15-2.jpg',
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsUrl({}, { each: true })
  images?: string[];

  @ApiProperty({
    description: 'Whether the product is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

}
