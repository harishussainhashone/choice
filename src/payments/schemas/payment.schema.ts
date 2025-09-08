import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop({ type: String, default: null })
  transactionId?: string;

  @Prop({ type: String, default: null })
  paymentIntentId?: string; // For Stripe

  @Prop({ type: String, default: null })
  paypalOrderId?: string; // For PayPal

  @Prop({ type: String, default: null })
  paypalCaptureId?: string; // For PayPal

  @Prop({ type: Object, default: null })
  paymentDetails?: any; // Store additional payment provider details

  @Prop({ type: String, default: null })
  failureReason?: string;

  @Prop({ type: Date, default: null })
  processedAt?: Date;

  @Prop({ type: Date, default: null })
  refundedAt?: Date;

  @Prop({ type: Number, default: null })
  refundedAmount?: number;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Create indexes for better performance
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ paymentMethod: 1 });
PaymentSchema.index({ transactionId: 1 });
