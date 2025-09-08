import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NewsletterService } from './newsletter.service';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';
import { QueryNewsletterDto } from './dto/query-newsletter.dto';
import { VerifyNewsletterDto, UnsubscribeNewsletterDto } from './dto/verify-newsletter.dto';
import { Newsletter } from './schemas/newsletter.schema';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  // User endpoints
  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Subscribe to newsletter' })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully subscribed to newsletter',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        verificationToken: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 409, description: 'Conflict - email already subscribed' })
  async subscribe(@Body() subscribeDto: SubscribeNewsletterDto) {
    return this.newsletterService.subscribe(subscribeDto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email subscription' })
  @ApiResponse({ 
    status: 200, 
    description: 'Email verified successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid token or already verified' })
  @ApiResponse({ status: 404, description: 'Not found - invalid verification token' })
  async verifyEmail(@Body() verifyDto: VerifyNewsletterDto) {
    return this.newsletterService.verifyEmail(verifyDto);
  }

  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe from newsletter using token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully unsubscribed from newsletter',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Not found - invalid unsubscribe token' })
  async unsubscribe(@Body() unsubscribeDto: UnsubscribeNewsletterDto) {
    return this.newsletterService.unsubscribe(unsubscribeDto);
  }

  @Post('unsubscribe/:email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe from newsletter using email' })
  @ApiParam({ name: 'email', description: 'Email address to unsubscribe' })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully unsubscribed from newsletter',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - already unsubscribed' })
  @ApiResponse({ status: 404, description: 'Not found - email not found' })
  async unsubscribeByEmail(@Param('email') email: string) {
    return this.newsletterService.unsubscribeByEmail(email);
  }

  // Admin endpoints
  @Get('admin/subscribers')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get all newsletter subscribers (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of newsletter subscribers with pagination',
    schema: {
      type: 'object',
      properties: {
        subscribers: { 
          type: 'array', 
          items: { $ref: '#/components/schemas/Newsletter' } 
        },
        total: { type: 'number' },
        page: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async findAll(@Query() queryDto: QueryNewsletterDto) {
    return this.newsletterService.findAll(queryDto);
  }

  @Get('admin/subscribers/:id')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get newsletter subscriber by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Subscriber ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Newsletter subscriber found',
    type: Newsletter,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'Subscriber not found' })
  async findOne(@Param('id') id: string): Promise<Newsletter> {
    return this.newsletterService.findOne(id);
  }

  @Get('admin/stats')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get newsletter statistics (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Newsletter statistics',
    schema: {
      type: 'object',
      properties: {
        totalSubscribers: { type: 'number' },
        activeSubscribers: { type: 'number' },
        verifiedSubscribers: { type: 'number' },
        unverifiedSubscribers: { type: 'number' },
        totalEmailsSent: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async getStats() {
    return this.newsletterService.getNewsletterStats();
  }

  @Get('admin/active-subscribers')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get all active verified subscribers (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of active verified subscribers',
    type: [Newsletter],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async getActiveSubscribers(): Promise<Newsletter[]> {
    return this.newsletterService.getActiveSubscribers();
  }

  @Delete('admin/subscribers/:id')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete newsletter subscriber (Admin only)' })
  @ApiParam({ name: 'id', description: 'Subscriber ID' })
  @ApiResponse({ status: 204, description: 'Subscriber deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'Subscriber not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.newsletterService.remove(id);
  }
}
