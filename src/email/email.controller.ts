// src/email/email.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { SendBulkEmailDto, SendEmailDto } from './dto/send-email.dto';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) { }

  @Post('send-to-customer')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send email to customer (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Email sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        messageId: { type: 'string' },
        message: { type: 'string' },
        logId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Email sending failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async sendEmailToCustomer(@Request() req, @Body() sendEmailDto: SendEmailDto) {
    // req.user.userId contains the admin ID from the AdminGuard
    return this.emailService.sendEmailToCustomer(req.user.userId, sendEmailDto);
  }

  @Post('send-to-all-customers')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send email to all customers (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Email sent to all customers',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        totalSent: { type: 'number' },
        totalFailed: { type: 'number' },
        failedEmails: {
          type: 'array',
          items: { type: 'string' }
        },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Email sending failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'No customers found' })
  async sendEmailToAllCustomers(@Request() req, @Body() sendBulkEmailDto: SendBulkEmailDto) {
    const { subject, message } = sendBulkEmailDto;
    return this.emailService.sendEmailToAllCustomers(req.user.userId, subject, message);
  }

  @Get('logs')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get email logs (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'Email logs retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        logs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              sentBy: { type: 'string' },
              sentTo: { type: 'string' },
              subject: { type: 'string' },
              message: { type: 'string' },
              status: { type: 'string' },
              messageId: { type: 'string' },
              errorMessage: { type: 'string' },
              sentAt: { type: 'string' },
            },
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getEmailLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.emailService.getEmailLogs(page, limit);
  }

  
}