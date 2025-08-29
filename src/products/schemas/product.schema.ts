import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  shortDescription: string; // Brief product summary

  @Prop({ type: Object, default: {} })
  additionalInfo: Record<string, any>; // Flexible additional information object

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true })
  categoryId: string;

  @Prop({ required: true })
  thumbnail: string; // Main thumbnail image URL

  @Prop({ type: [String], default: [] })
  images: string[]; // Array of additional image URLs

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  rating: number; // Average rating (0-5)

  @Prop({ default: 0 })
  reviewCount: number; // Number of reviews

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
