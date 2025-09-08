import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';
import { Payment, PaymentDocument, PaymentStatus, PaymentMethod } from './schemas/payment.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {
    // Initialize Stripe
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...', {
      apiVersion: '2025-08-27.basil',
    });
  }

  // Create Stripe Payment Intent
  async createStripePayment(createPaymentDto: CreatePaymentDto, userId: string): Promise<any> {
    const { orderId, amount, currency, successUrl, cancelUrl } = createPaymentDto;

    try {
      // Create Stripe Payment Intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          orderId,
          userId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Create payment record in database
      const payment = new this.paymentModel({
        orderId: new Types.ObjectId(orderId),
        userId: new Types.ObjectId(userId),
        paymentMethod: PaymentMethod.STRIPE,
        amount,
        currency,
        status: PaymentStatus.PENDING,
        paymentIntentId: paymentIntent.id,
        paymentDetails: {
          clientSecret: paymentIntent.client_secret,
          successUrl,
          cancelUrl,
        },
      });

      await payment.save();

      return {
        paymentId: payment._id,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
        currency,
      };
    } catch (error) {
      throw new BadRequestException(`Stripe payment creation failed: ${error.message}`);
    }
  }

  // Create PayPal Order
  async createPayPalPayment(createPaymentDto: CreatePaymentDto, userId: string): Promise<any> {
    const { orderId, amount, currency, successUrl, cancelUrl } = createPaymentDto;

    try {
      // Get PayPal access token
      const accessToken = await this.getPayPalAccessToken();
      
      // Create PayPal order
      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency.toUpperCase(),
            value: amount.toString(),
          },
          custom_id: orderId,
        }],
        application_context: {
          brand_name: 'Choice Delivery',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: successUrl || `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel`,
        },
      };

      const response = await fetch(`${this.getPayPalBaseUrl()}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'PayPal-Request-Id': orderId,
        },
        body: JSON.stringify(orderData),
      });

      const order = await response.json();

      if (!response.ok) {
        throw new Error(`PayPal API error: ${order.message || 'Unknown error'}`);
      }

      // Create payment record in database
      const payment = new this.paymentModel({
        orderId: new Types.ObjectId(orderId),
        userId: new Types.ObjectId(userId),
        paymentMethod: PaymentMethod.PAYPAL,
        amount,
        currency,
        status: PaymentStatus.PENDING,
        paypalOrderId: order.id,
        paymentDetails: {
          orderId: order.id,
          approvalUrl: order.links.find(link => link.rel === 'approve')?.href,
          successUrl,
          cancelUrl,
        },
      });

      await payment.save();

      return {
        paymentId: payment._id,
        orderId: order.id,
        approvalUrl: order.links.find(link => link.rel === 'approve')?.href,
        amount,
        currency,
      };
    } catch (error) {
      throw new BadRequestException(`PayPal payment creation failed: ${error.message}`);
    }
  }

  // Confirm Stripe Payment
  async confirmStripePayment(confirmPaymentDto: ConfirmPaymentDto): Promise<any> {
    const { paymentIntentId } = confirmPaymentDto;

    try {
      // Retrieve payment intent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      // Find payment record
      const payment = await this.paymentModel.findOne({ paymentIntentId }).exec();
      if (!payment) {
        throw new NotFoundException('Payment record not found');
      }

      // Update payment status based on Stripe status
      if (paymentIntent.status === 'succeeded') {
        payment.status = PaymentStatus.COMPLETED;
        payment.processedAt = new Date();
        payment.transactionId = paymentIntent.latest_charge as string;
      } else if (paymentIntent.status === 'requires_payment_method') {
        payment.status = PaymentStatus.FAILED;
        payment.failureReason = 'Payment method required';
      } else if (paymentIntent.status === 'canceled') {
        payment.status = PaymentStatus.CANCELLED;
        payment.failureReason = 'Payment cancelled';
      }

      await payment.save();

      return {
        paymentId: payment._id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
      };
    } catch (error) {
      throw new BadRequestException(`Payment confirmation failed: ${error.message}`);
    }
  }

  // Confirm PayPal Payment
  async confirmPayPalPayment(confirmPaymentDto: ConfirmPaymentDto): Promise<any> {
    const { paypalOrderId } = confirmPaymentDto;

    try {
      // Find payment record
      const payment = await this.paymentModel.findOne({ paypalOrderId }).exec();
      if (!payment) {
        throw new NotFoundException('Payment record not found');
      }

      // Get PayPal access token
      const accessToken = await this.getPayPalAccessToken();

      // Capture PayPal order
      const response = await fetch(`${this.getPayPalBaseUrl()}/v2/checkout/orders/${paypalOrderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      });

      const order = await response.json();

      if (!response.ok) {
        throw new Error(`PayPal capture error: ${order.message || 'Unknown error'}`);
      }

      if (order.status === 'COMPLETED') {
        payment.status = PaymentStatus.COMPLETED;
        payment.processedAt = new Date();
        payment.paypalCaptureId = order.purchase_units[0].payments.captures[0].id;
        payment.transactionId = order.purchase_units[0].payments.captures[0].id;
      } else {
        payment.status = PaymentStatus.FAILED;
        payment.failureReason = `PayPal order status: ${order.status}`;
      }

      await payment.save();

      return {
        paymentId: payment._id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        transactionId: payment.transactionId,
      };
    } catch (error) {
      throw new BadRequestException(`PayPal payment confirmation failed: ${error.message}`);
    }
  }

  // Get Payment by ID
  async getPayment(paymentId: string): Promise<Payment> {
    const payment = await this.paymentModel.findById(paymentId).exec();
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  // Get Payments by User
  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    return await this.paymentModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  // Get Payments by Order
  async getPaymentsByOrder(orderId: string): Promise<Payment[]> {
    return await this.paymentModel
      .find({ orderId: new Types.ObjectId(orderId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  // Process Stripe Webhook
  async processStripeWebhook(signature: string, payload: any): Promise<void> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || 'whsec_...'
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handleStripePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handleStripePaymentFailed(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      throw new BadRequestException(`Webhook signature verification failed: ${error.message}`);
    }
  }

  // Handle Stripe Payment Success
  private async handleStripePaymentSuccess(paymentIntent: any): Promise<void> {
    const payment = await this.paymentModel.findOne({ 
      paymentIntentId: paymentIntent.id 
    }).exec();

    if (payment) {
      payment.status = PaymentStatus.COMPLETED;
      payment.processedAt = new Date();
      payment.transactionId = paymentIntent.latest_charge;
      await payment.save();
    }
  }

  // Handle Stripe Payment Failed
  private async handleStripePaymentFailed(paymentIntent: any): Promise<void> {
    const payment = await this.paymentModel.findOne({ 
      paymentIntentId: paymentIntent.id 
    }).exec();

    if (payment) {
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
      await payment.save();
    }
  }

  // Refund Payment
  async refundPayment(paymentId: string, amount?: number): Promise<any> {
    const payment = await this.paymentModel.findById(paymentId).exec();
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    try {
      let refund;

      if (payment.paymentMethod === PaymentMethod.STRIPE) {
        refund = await this.stripe.refunds.create({
          payment_intent: payment.paymentIntentId,
          amount: amount ? Math.round(amount * 100) : undefined,
        });
      } else if (payment.paymentMethod === PaymentMethod.PAYPAL) {
        // PayPal refund implementation
        const accessToken = await this.getPayPalAccessToken();
        
        const refundData = {
          amount: {
            currency_code: payment.currency.toUpperCase(),
            value: amount ? amount.toString() : payment.amount.toString(),
          },
        };

        const response = await fetch(`${this.getPayPalBaseUrl()}/v2/payments/captures/${payment.paypalCaptureId}/refund`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(refundData),
        });

        refund = await response.json();

        if (!response.ok) {
          throw new Error(`PayPal refund error: ${refund.message || 'Unknown error'}`);
        }
      }

      // Update payment record
      payment.status = PaymentStatus.REFUNDED;
      payment.refundedAt = new Date();
      payment.refundedAmount = amount || payment.amount;
      await payment.save();

      return {
        paymentId: payment._id,
        refundId: refund.id,
        amount: payment.refundedAmount,
        status: payment.status,
      };
    } catch (error) {
      throw new BadRequestException(`Refund failed: ${error.message}`);
    }
  }

  // PayPal Helper Methods
  private getPayPalBaseUrl(): string {
    return process.env.NODE_ENV === 'production' 
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  private async getPayPalAccessToken(): Promise<string> {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials not configured');
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(`${this.getPayPalBaseUrl()}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`PayPal auth error: ${data.error_description || 'Unknown error'}`);
    }

    return data.access_token;
  }
}
