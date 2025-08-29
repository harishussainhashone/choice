import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNumber, Min } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'The name of the user',
    example: 'John Doe',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'john@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The age of the user',
    example: 30,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  age: number;
}
