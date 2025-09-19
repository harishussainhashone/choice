import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class SendEmailDto {
  @ApiProperty({
    description: 'Recipient email address',
    example: 'customer@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  mailTo: string;

  @ApiProperty({
    description: 'Email subject line',
    example: 'Special Offer - 50% Off All Products!',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'Email message content',
    example: 'Dear Customer,\n\nWe are excited to offer you a special discount...',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}