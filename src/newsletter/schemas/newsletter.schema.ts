import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NewsletterDocument = Newsletter & Document;

@Schema({ timestamps: true })
export class Newsletter {
  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ default: true })
  isActive: boolean; // Whether subscription is active

  @Prop({ default: false })
  isVerified: boolean; // Whether email is verified

  @Prop({ type: String, default: null })
  verificationToken?: string; // Token for email verification

  @Prop({ type: Date, default: null })
  verifiedAt?: Date; // When email was verified

  @Prop({ type: Date, default: null })
  unsubscribedAt?: Date; // When user unsubscribed

  @Prop({ type: String, default: null })
  unsubscribeToken?: string; // Token for unsubscribe

  @Prop({ default: 0 })
  emailCount: number; // Number of emails sent to this subscriber

  @Prop({ type: [String], default: [] })
  preferences: string[]; // User preferences for newsletter content

  @Prop({ type: String, default: null })
  source: string; // Where the subscription came from (website, app, etc.)
}

export const NewsletterSchema = SchemaFactory.createForClass(Newsletter);

// Add indexes for better performance
NewsletterSchema.index({ email: 1 });
NewsletterSchema.index({ isActive: 1 });
NewsletterSchema.index({ isVerified: 1 });
NewsletterSchema.index({ createdAt: -1 });
NewsletterSchema.index({ verificationToken: 1 });
NewsletterSchema.index({ unsubscribeToken: 1 });
