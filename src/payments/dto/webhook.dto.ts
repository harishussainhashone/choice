import { IsNotEmpty, IsString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StripeWebhookDto {
  @ApiProperty({ description: 'Stripe webhook signature' })
  @IsNotEmpty()
  @IsString()
  signature: string;

  @ApiProperty({ description: 'Webhook payload' })
  @IsNotEmpty()
  @IsObject()
  payload: any;
}

export class PayPalWebhookDto {
  @ApiProperty({ description: 'PayPal webhook payload' })
  @IsNotEmpty()
  @IsObject()
  payload: any;
}
