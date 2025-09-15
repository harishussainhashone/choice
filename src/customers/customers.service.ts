import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { QueryCustomersDto } from './dto/query-customers.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async findAllCustomers(queryDto: QueryCustomersDto): Promise<{
    customers: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    // Build filter for customers (exclude admins)
    const filter: any = { role: 'user' };

    // Search by name, email, or username
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get customers with basic info
    const [customers, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    // Enhance customer data with order statistics
    const enhancedCustomers = await Promise.all(
      customers.map(async (customer) => {
        // Get order statistics
        const orderStats = await this.orderModel.aggregate([
          { $match: { userId: customer._id.toString() } },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalSpent: { $sum: '$totalAmount' },
              lastOrderDate: { $max: '$createdAt' },
            },
          },
        ]);

        return {
          ...customer,
          totalOrders: orderStats[0]?.totalOrders || 0,
          totalSpent: orderStats[0]?.totalSpent || 0,
          lastOrderDate: orderStats[0]?.lastOrderDate || null,
        };
      }),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      customers: enhancedCustomers,
      total,
      page,
      totalPages,
    };
  }

  async getCustomerDetails(customerId: string): Promise<any> {
    // Get customer basic info
    const customer = await this.userModel
      .findById(customerId)
      .select('-password')
      .lean()
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (customer.role === 'admin') {
      throw new NotFoundException('Customer not found');
    }

    // Get recent orders
    const orders = await this.orderModel
      .find({ userId: customerId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber totalAmount status createdAt')
      .lean()
      .exec();

    // Get statistics
    const statistics = await this.getCustomerStatisticsById(customerId);

    return {
      customer,
      orders,
      statistics,
    };
  }

  async getCustomerOrders(customerId: string): Promise<any> {
    const customer = await this.userModel.findById(customerId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (customer.role === 'admin') {
      throw new NotFoundException('Customer not found');
    }

    const orders = await this.orderModel
      .find({ userId: customerId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const stats = await this.orderModel.aggregate([
      { $match: { userId: customerId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' },
        },
      },
    ]);

    return {
      orders,
      total: stats[0]?.total || 0,
      totalSpent: stats[0]?.totalSpent || 0,
      averageOrderValue: stats[0]?.averageOrderValue || 0,
    };
  }

  private async getCustomerStatisticsById(customerId: string): Promise<any> {
    const stats = await this.orderModel.aggregate([
      { $match: { userId: customerId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' },
          lastOrderDate: { $max: '$createdAt' },
        },
      },
    ]);

    return {
      totalOrders: stats[0]?.totalOrders || 0,
      totalSpent: stats[0]?.totalSpent || 0,
      averageOrderValue: stats[0]?.averageOrderValue || 0,
      lastOrderDate: stats[0]?.lastOrderDate || null,
    };
  }
}
