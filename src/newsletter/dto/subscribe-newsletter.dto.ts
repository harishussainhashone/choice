import { IsEmail, IsOptional, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscribeNewsletterDto {
  @ApiProperty({
    description: 'Email address for newsletter subscription',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'User preferences for newsletter content',
    example: ['promotions', 'updates', 'news'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferences?: string[];

  @ApiProperty({
    description: 'Source of the subscription',
    example: 'website',
    required: false,
  })
  @IsOptional()
  @IsString()
  source?: string;
}
