import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { Order } from './schemas/order.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Checkout cart and create order' })
  @ApiResponse({ 
    status: 201, 
    description: 'Order created successfully',
    type: Order,
  })
  @ApiResponse({ status: 400, description: 'Bad request - cart is empty or invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkout(@Request() req, @Body() checkoutDto: CheckoutDto): Promise<Order> {
    return this.ordersService.checkout(req.user.userId, checkoutDto);
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Get user orders' })
  @ApiResponse({ 
    status: 200, 
    description: 'User orders retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        orders: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
        total: { type: 'number' },
        page: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserOrders(@Request() req, @Query() queryDto: QueryOrdersDto) {
    return this.ordersService.findUserOrders(req.user.userId, queryDto);
  }

  @Get('my-orders/:id')
  @ApiOperation({ summary: 'Get user order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Order found',
    type: Order,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getUserOrder(@Request() req, @Param('id') id: string): Promise<Order> {
    const order = await this.ordersService.findOne(id);
    // Ensure user can only access their own orders
    if (order.userId !== req.user.userId) {
      throw new ForbiddenException('Access denied');
    }
    return order;
  }

  @Patch('my-orders/:id/cancel')
  @ApiOperation({ summary: 'Cancel user order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Order cancelled successfully',
    type: Order,
  })
  @ApiResponse({ status: 400, description: 'Bad request - order cannot be cancelled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancelOrder(@Request() req, @Param('id') id: string): Promise<Order> {
    return this.ordersService.cancelOrder(id, req.user.userId);
  }

  @Get('my-orders/stats')
  @ApiOperation({ summary: 'Get user order statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Order statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalOrders: { type: 'number' },
        totalRevenue: { type: 'number' },
        averageOrderValue: { type: 'number' },
        pendingOrders: { type: 'number' },
        confirmedOrders: { type: 'number' },
        deliveredOrders: { type: 'number' },
        cancelledOrders: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserOrderStats(@Request() req) {
    return this.ordersService.getOrderStats(req.user.userId);
  }

  // Admin endpoints
  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get all orders (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'All orders retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        orders: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
        total: { type: 'number' },
        page: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async getAllOrders(@Query() queryDto: QueryOrdersDto) {
    return this.ordersService.findAll(queryDto);
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get order by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Order found',
    type: Order,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(@Param('id') id: string): Promise<Order> {
    return this.ordersService.findOne(id);
  }

  @Get('number/:orderNumber')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get order by order number (Admin only)' })
  @ApiParam({ name: 'orderNumber', description: 'Order number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Order found',
    type: Order,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderByNumber(@Param('orderNumber') orderNumber: string): Promise<Order> {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  @Patch(':id/status')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update order status (Admin only)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Order status updated successfully',
    type: Order,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }

  @Get('stats/overview')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get order statistics overview (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Order statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalOrders: { type: 'number' },
        totalRevenue: { type: 'number' },
        averageOrderValue: { type: 'number' },
        pendingOrders: { type: 'number' },
        confirmedOrders: { type: 'number' },
        deliveredOrders: { type: 'number' },
        cancelledOrders: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async getOrderStats() {
    return this.ordersService.getOrderStats();
  }
}
