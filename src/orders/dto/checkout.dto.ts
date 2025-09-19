import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
  IsString, 
  IsNotEmpty, 
  IsEmail, 
  IsOptional, 
  ValidateNested,
  IsObject 
} from 'class-validator';

export class ShippingAddressDto {
  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Street address',
    example: '123 Main St',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'City',
    example: 'New York',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'State/Province',
    example: 'NY',
  })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({
    description: 'ZIP/Postal code',
    example: '10001',
  })
  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @ApiProperty({
    description: 'Country',
    example: 'USA',
  })
  @IsString()
  @IsNotEmpty()
  country: string;
}

export class CheckoutDto {
  @ApiProperty({
    description: 'Shipping address',
    type: ShippingAddressDto,
  })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  @IsObject()
  @IsNotEmpty()
  shippingAddress: ShippingAddressDto;

  @ApiProperty({
    description: 'Payment method',
    example: 'credit_card',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({
    description: 'Additional notes for the order',
    example: 'Please deliver in the morning',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}