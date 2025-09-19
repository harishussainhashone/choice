// src/email/schemas/email-log.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmailLogDocument = EmailLog & Document;

@Schema({ timestamps: true })
export class EmailLog {
  @Prop({ required: true })
  sentBy: string; // Admin user ID

  @Prop({ required: true })
  sentTo: string; // Customer email

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, enum: ['success', 'failed', 'pending'] })
  status: string;

  @Prop()
  messageId: string;

  @Prop()
  errorMessage?: string;

  @Prop({ default: Date.now })
  sentAt: Date;
}

export const EmailLogSchema = SchemaFactory.createForClass(EmailLog);