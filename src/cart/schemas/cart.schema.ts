import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CartDocument = Cart & Document;

@Schema({ timestamps: true })
export class CartItem {
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
export class Cart {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ type: [CartItem], default: [] })
  items: CartItem[];

  @Prop({ default: 0 })
  totalAmount: number; // Sum of all item totalPrices

  @Prop({ default: 0 })
  totalItems: number; // Sum of all item quantities

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
export const CartItemSchema = SchemaFactory.createForClass(CartItem);
