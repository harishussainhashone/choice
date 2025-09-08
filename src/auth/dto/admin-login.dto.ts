import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({
    description: 'The email address of the admin',
    example: 'admin@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The password of the admin',
    example: 'admin123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Firebase FCM token for push notifications',
    example: 'fcm_token_here_123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  firebaseToken?: string;
}
