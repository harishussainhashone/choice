import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyNewsletterDto {
  @ApiProperty({
    description: 'Verification token sent to email',
    example: 'abc123def456ghi789',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class UnsubscribeNewsletterDto {
  @ApiProperty({
    description: 'Unsubscribe token sent to email',
    example: 'xyz789uvw456rst123',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
