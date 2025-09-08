import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FaqsService } from './faqs.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { QueryFaqDto } from './dto/query-faq.dto';
import { Faq } from './schemas/faq.schema';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('faqs')
@Controller('faqs')
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  // User endpoints
  @Get()
  @ApiOperation({ summary: 'Get all active FAQs for users' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of active FAQs with pagination',
    schema: {
      type: 'object',
      properties: {
        faqs: { 
          type: 'array', 
          items: { $ref: '#/components/schemas/Faq' } 
        },
        total: { type: 'number' },
        page: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async findAll(@Query() queryDto: QueryFaqDto) {
    return this.faqsService.findActiveFaqs(queryDto);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular FAQs' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of FAQs to return' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of popular FAQs',
    type: [Faq],
  })
  async getPopularFaqs(@Query('limit') limit: number = 10): Promise<Faq[]> {
    return this.faqsService.getPopularFaqs(limit);
  }

  @Get('tag/:tag')
  @ApiOperation({ summary: 'Get FAQs by tag' })
  @ApiParam({ name: 'tag', description: 'Tag name' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of FAQs to return' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of FAQs with specified tag',
    type: [Faq],
  })
  async getFaqsByTag(@Param('tag') tag: string, @Query('limit') limit: number = 10): Promise<Faq[]> {
    return this.faqsService.getFaqsByTag(tag, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get FAQ by ID and increment view count' })
  @ApiParam({ name: 'id', description: 'FAQ ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'FAQ found',
    type: Faq,
  })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  async findOne(@Param('id') id: string): Promise<Faq> {
    return this.faqsService.incrementViewCount(id);
  }

  // Admin endpoints
  @Post()
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new FAQ (Admin only)' })
  @ApiResponse({ 
    status: 201, 
    description: 'FAQ created successfully',
    type: Faq,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async create(@Body() createFaqDto: CreateFaqDto): Promise<Faq> {
    return this.faqsService.create(createFaqDto);
  }

  @Get('admin/all')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get all FAQs including inactive (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all FAQs with pagination',
    schema: {
      type: 'object',
      properties: {
        faqs: { 
          type: 'array', 
          items: { $ref: '#/components/schemas/Faq' } 
        },
        total: { type: 'number' },
        page: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async findAllAdmin(@Query() queryDto: QueryFaqDto) {
    return this.faqsService.findAll(queryDto);
  }

  @Get('admin/stats')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get FAQ statistics (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'FAQ statistics',
    schema: {
      type: 'object',
      properties: {
        totalFaqs: { type: 'number' },
        activeFaqs: { type: 'number' },
        inactiveFaqs: { type: 'number' },
        totalViews: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async getStats() {
    return this.faqsService.getFaqStats();
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update FAQ by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'FAQ ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'FAQ updated successfully',
    type: Faq,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  async update(
    @Param('id') id: string,
    @Body() updateFaqDto: UpdateFaqDto,
  ): Promise<Faq> {
    return this.faqsService.update(id, updateFaqDto);
  }

  @Patch(':id/toggle-status')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Toggle FAQ active status (Admin only)' })
  @ApiParam({ name: 'id', description: 'FAQ ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'FAQ status toggled successfully',
    type: Faq,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  async toggleStatus(@Param('id') id: string): Promise<Faq> {
    return this.faqsService.toggleStatus(id);
  }

  @Patch(':id/order')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update FAQ order (Admin only)' })
  @ApiParam({ name: 'id', description: 'FAQ ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'FAQ order updated successfully',
    type: Faq,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  async updateOrder(
    @Param('id') id: string,
    @Body('order') order: number,
  ): Promise<Faq> {
    return this.faqsService.updateOrder(id, order);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete FAQ by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'FAQ ID' })
  @ApiResponse({ status: 204, description: 'FAQ deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.faqsService.remove(id);
  }
}
