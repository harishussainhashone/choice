import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

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
}
