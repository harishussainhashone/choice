import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Headers,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { StripeWebhookDto, PayPalWebhookDto } from './dto/webhook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Payment, PaymentStatus } from './schemas/payment.schema';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('stripe/create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe payment intent' })
  @ApiResponse({ 
    status: 201, 
    description: 'Stripe payment intent created successfully',
    schema: {
      type: 'object',
      properties: {
        paymentId: { type: 'string' },
        clientSecret: { type: 'string' },
        paymentIntentId: { type: 'string' },
        amount: { type: 'number' },
        currency: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid payment data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createStripePayment(
    @Request() req,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return await this.paymentsService.createStripePayment(createPaymentDto, req.user.userId);
  }

  @Post('paypal/create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create PayPal order' })
  @ApiResponse({ 
    status: 201, 
    description: 'PayPal order created successfully',
    schema: {
      type: 'object',
      properties: {
        paymentId: { type: 'string' },
        orderId: { type: 'string' },
        approvalUrl: { type: 'string' },
        amount: { type: 'number' },
        currency: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid payment data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPayPalPayment(
    @Request() req,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return await this.paymentsService.createPayPalPayment(createPaymentDto, req.user.userId);
  }

  @Post('stripe/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm Stripe payment' })
  @ApiResponse({ 
    status: 200, 
    description: 'Stripe payment confirmed successfully',
    schema: {
      type: 'object',
      properties: {
        paymentId: { type: 'string' },
        status: { type: 'string', enum: Object.values(PaymentStatus) },
        amount: { type: 'number' },
        currency: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - payment confirmation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async confirmStripePayment(@Body() confirmPaymentDto: ConfirmPaymentDto) {
    return await this.paymentsService.confirmStripePayment(confirmPaymentDto);
  }

  @Post('paypal/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm PayPal payment' })
  @ApiResponse({ 
    status: 200, 
    description: 'PayPal payment confirmed successfully',
    schema: {
      type: 'object',
      properties: {
        paymentId: { type: 'string' },
        status: { type: 'string', enum: Object.values(PaymentStatus) },
        amount: { type: 'number' },
        currency: { type: 'string' },
        transactionId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - payment confirmation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async confirmPayPalPayment(@Body() confirmPaymentDto: ConfirmPaymentDto) {
    return await this.paymentsService.confirmPayPalPayment(confirmPaymentDto);
  }

  @Get(':paymentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment details by ID' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment details retrieved successfully',
    type: Payment,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPayment(@Param('paymentId') paymentId: string): Promise<Payment> {
    return await this.paymentsService.getPayment(paymentId);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payments by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'User payments retrieved successfully',
    type: [Payment],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPaymentsByUser(@Param('userId') userId: string): Promise<Payment[]> {
    return await this.paymentsService.getPaymentsByUser(userId);
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payments by order ID' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Order payments retrieved successfully',
    type: [Payment],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPaymentsByOrder(@Param('orderId') orderId: string): Promise<Payment[]> {
    return await this.paymentsService.getPaymentsByOrder(orderId);
  }

  @Post('stripe/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiHeader({ name: 'stripe-signature', description: 'Stripe webhook signature' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Webhook signature verification failed' })
  async stripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    await this.paymentsService.processStripeWebhook(signature, req.rawBody);
    return { received: true };
  }

  @Post('paypal/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PayPal webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async paypalWebhook(@Body() webhookDto: PayPalWebhookDto) {
    // PayPal webhook processing logic
    console.log('PayPal webhook received:', webhookDto.payload);
    return { received: true };
  }

  @Post(':paymentId/refund')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refund a payment' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment refunded successfully',
    schema: {
      type: 'object',
      properties: {
        paymentId: { type: 'string' },
        refundId: { type: 'string' },
        amount: { type: 'number' },
        status: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - refund failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async refundPayment(
    @Param('paymentId') paymentId: string,
    @Body('amount') amount?: number,
  ) {
    return await this.paymentsService.refundPayment(paymentId, amount);
  }
}
