import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('customers')
@Controller('customers')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all customers with filtering and pagination (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of customers with pagination info',
    schema: {
      type: 'object',
      properties: {
        customers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              username: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              age: { type: 'number' },
              role: { type: 'string' },
              createdAt: { type: 'string' },
              lastLogoutAt: { type: 'string' },
              totalOrders: { type: 'number' },
              totalSpent: { type: 'number' },
              lastOrderDate: { type: 'string' },
            },
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async findAll(@Query() queryDto: QueryCustomersDto) {
    return this.customersService.findAllCustomers(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer details by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer details with order history',
    schema: {
      type: 'object',
      properties: {
        customer: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            username: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            age: { type: 'number' },
            role: { type: 'string' },
            createdAt: { type: 'string' },
            lastLogoutAt: { type: 'string' },
          },
        },
        orders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              orderNumber: { type: 'string' },
              totalAmount: { type: 'number' },
              status: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
        },
        statistics: {
          type: 'object',
          properties: {
            totalOrders: { type: 'number' },
            totalSpent: { type: 'number' },
            averageOrderValue: { type: 'number' },
            lastOrderDate: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findOne(@Param('id') id: string) {
    return this.customersService.getCustomerDetails(id);
  }

  @Get(':id/orders')
  @ApiOperation({ summary: 'Get customer order history (Admin only)' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer order history',
    schema: {
      type: 'object',
      properties: {
        orders: { 
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              orderNumber: { type: 'string' },
              totalAmount: { type: 'number' },
              status: { type: 'string' },
              createdAt: { type: 'string' },
              items: { type: 'array' },
              shippingAddress: { type: 'object' },
            },
          },
        },
        total: { type: 'number' },
        totalSpent: { type: 'number' },
        averageOrderValue: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomerOrders(@Param('id') id: string) {
    return this.customersService.getCustomerOrders(id);
  }
}
