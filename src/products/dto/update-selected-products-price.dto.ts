import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, Min, ArrayNotEmpty } from 'class-validator';

export class UpdateSelectedProductsPriceDto {
  @ApiProperty({
    description: 'Array of product IDs to update',
    example: ['64f4a3b2c7f8e2d1a9d12345', '64f4a3b2c7f8e2d1a9d12346'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsNotEmpty({ each: true })
  productIds: string[];

  @ApiProperty({
    description: 'The new fixed price to set for all selected products',
    example: 50.99,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  newPrice: number;
}
