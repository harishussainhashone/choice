import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('admin')
@Controller('admin')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard data (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Admin dashboard data with graphs and statistics',
    schema: {
      type: 'object',
      properties: {
        earningsData: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Mon' },
              total: { type: 'number', example: 4000 },
              today: { type: 'number', example: 2400 },
            },
          },
        },
        customerData: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              subject: { type: 'string', example: 'Mon' },
              customers: { type: 'number', example: 120 },
              orders: { type: 'number', example: 80 },
            },
          },
        },
        overallData: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Total Orders' },
              value: { type: 'number', example: 1200 },
            },
          },
        },
        summary: {
          type: 'object',
          properties: {
            earningsToday: { type: 'number', example: 2400 },
            earningsOverall: { type: 'number', example: 9500 },
            totalCustomers: { type: 'number', example: 420 },
            ordersTotal: { type: 'number', example: 1200 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async getDashboard() {
    return this.adminService.getDashboardData();
  }
}
