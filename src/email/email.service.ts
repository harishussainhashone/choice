// src/email/email.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { EmailLog, EmailLogDocument } from './schemas/email-log.schema';
import { SendEmailDto } from './dto/send-email.dto';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(EmailLog.name) private emailLogModel: Model<EmailLogDocument>,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, 
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS, 
        },
      });

    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Email transporter error:', error);
      } else {
        console.log('Email server is ready to send messages');
      }
    });
  }

  async sendEmailToCustomer(
    adminId: string,
    sendEmailDto: SendEmailDto
  ): Promise<{
    success: boolean;
    messageId?: string;
    message: string;
    logId?: string;
  }> {
    const { mailTo, subject, message } = sendEmailDto;

    const customer = await this.userModel.findOne({ 
      email: mailTo,
      role: 'user' // Only send to customers, not admins
    }).exec();

    if (!customer) {
      throw new NotFoundException(`Customer with email ${mailTo} not found`);
    }

    const emailLog = new this.emailLogModel({
      sentBy: adminId,
      sentTo: mailTo,
      subject,
      message,
      status: 'pending',
    });
    await emailLog.save();

    try {
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Choice Delivery'}" <${process.env.SMTP_USER}>`,
        to: mailTo,
        subject: subject,
        html: this.generateHtmlEmail(customer.name || customer.username, message), // HTML version
      };

      const info = await this.transporter.sendMail(mailOptions);

      emailLog.status = 'success';
      emailLog.messageId = info.messageId;
      await emailLog.save();

      console.log(`Email sent successfully to ${mailTo}. MessageId: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        message: `Email sent successfully to ${mailTo}`,
        logId: (emailLog as any)._id.toString(),
      };
    } catch (error) {
      emailLog.status = 'failed';
      emailLog.errorMessage = error.message;
      await emailLog.save();

      console.error('Email sending failed:', error);
      
      throw new BadRequestException(`Failed to send email: ${error.message}`);
    }
  }

  private generateHtmlEmail(customerName: string, message: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #e74c3c; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Choice Delivery</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              <p>${message.replace(/\n/g, '<br>')}</p>
              <br>
              <p>Best regards,<br>Choice Delivery Team</p>
            </div>
            <div class="footer">
              <p>© 2024 Choice Delivery. All rights reserved.</p>
              <p>This email was sent to you as a valued customer.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  async getEmailLogs(page: number = 1, limit: number = 10): Promise<any> {
    const skip = (page - 1) * limit;
    
    const [logs, total] = await Promise.all([
      this.emailLogModel
        .find()
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.emailLogModel.countDocuments(),
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}