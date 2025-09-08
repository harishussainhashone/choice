import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FaqDocument = Faq & Document;

@Schema({ timestamps: true })
export class Faq {
  @Prop({ required: true, minlength: 10, maxlength: 500 })
  question: string;

  @Prop({ required: true, minlength: 20, maxlength: 2000 })
  answer: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  order: number; // For ordering FAQs

  @Prop({ type: [String], default: [] })
  tags: string[]; // Optional tags for categorization

  @Prop({ default: 0 })
  viewCount: number; // Track how many times FAQ is viewed
}

export const FaqSchema = SchemaFactory.createForClass(Faq);

// Add indexes for better performance
FaqSchema.index({ isActive: 1 });
FaqSchema.index({ order: 1 });
FaqSchema.index({ tags: 1 });
FaqSchema.index({ createdAt: -1 });
