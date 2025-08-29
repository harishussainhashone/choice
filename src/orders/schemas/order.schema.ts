import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class OrderItem {
  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  productPrice: number;

  @Prop({ required: true })
  productThumbnail: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true })
  totalPrice: number; // productPrice * quantity
}

@Schema({ timestamps: true })
export class ShippingAddress {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  zipCode: string;

  @Prop({ required: true })
  country: string;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true })
  orderNumber: string; // Unique order number

  @Prop({ required: true })
  userId: string;

  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[];

  @Prop({ type: ShippingAddress, required: true })
  shippingAddress: ShippingAddress;

  @Prop({ required: true, min: 0 })
  subtotal: number; // Sum of all item totalPrices

  @Prop({ required: true, min: 0, default: 0 })
  shippingCost: number;

  @Prop({ required: true, min: 0, default: 0 })
  tax: number;

  @Prop({ required: true, min: 0 })
  totalAmount: number; // subtotal + shippingCost + tax

  @Prop({ required: true, min: 0 })
  totalItems: number; // Sum of all item quantities

  @Prop({ 
    type: String, 
    enum: OrderStatus, 
    default: OrderStatus.PENDING 
  })
  status: OrderStatus;

  @Prop({ type: String, required: false })
  paymentMethod: string;

  @Prop({ type: String, required: false })
  paymentStatus: string; // 'pending', 'paid', 'failed'

  @Prop({ type: String, required: false })
  notes: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
export const ShippingAddressSchema = SchemaFactory.createForClass(ShippingAddress);
