import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Newsletter, NewsletterDocument } from '../newsletter/schemas/newsletter.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Newsletter.name) private newsletterModel: Model<NewsletterDocument>,
  ) {}

  async getDashboardData(): Promise<{
    earningsData: Array<{ name: string; total: number; today: number }>;
    customerData: Array<{ subject: string; customers: number; orders: number }>;
    overallData: Array<{ name: string; value: number }>;
    summary: {
      earningsToday: number;
      earningsOverall: number;
      totalCustomers: number;
      ordersTotal: number;
    };
  }> {
    // Get last 7 days data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6); // Last 7 days including today

    // Generate date labels for the last 7 days
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dateLabels: Array<{ label: string; date: Date; nextDate: Date }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dateLabels.push({
        label: days[date.getDay()],
        date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        nextDate: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      });
    }

    // Get earnings data (total amount from orders)
    const earningsData = await Promise.all(
      dateLabels.map(async (day) => {
        const dayStart = day.date;
        const dayEnd = day.nextDate;

        // Get total earnings for this day
        const dayEarnings = await this.orderModel.aggregate([
          {
            $match: {
              createdAt: { $gte: dayStart, $lt: dayEnd },
              status: { $ne: 'cancelled' }, // Exclude cancelled orders
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$totalAmount' },
            },
          },
        ]);

        // Get cumulative earnings up to this day
        const cumulativeEarnings = await this.orderModel.aggregate([
          {
            $match: {
              createdAt: { $lt: dayEnd },
              status: { $ne: 'cancelled' },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$totalAmount' },
            },
          },
        ]);

        return {
          name: day.label,
          total: cumulativeEarnings[0]?.total || 0,
          today: dayEarnings[0]?.total || 0,
        };
      }),
    );

    // Get customer data (new customers and orders per day)
    const customerData = await Promise.all(
      dateLabels.map(async (day) => {
        const dayStart = day.date;
        const dayEnd = day.nextDate;

        // Get new customers for this day
        const newCustomers = await this.userModel.countDocuments({
          createdAt: { $gte: dayStart, $lt: dayEnd },
          role: 'user',
        });

        // Get orders for this day
        const orders = await this.orderModel.countDocuments({
          createdAt: { $gte: dayStart, $lt: dayEnd },
          status: { $ne: 'cancelled' },
        });

        return {
          subject: day.label,
          customers: newCustomers,
          orders: orders,
        };
      }),
    );

    // Get overall statistics
    const [
      totalOrders,
      totalNewsletterSubscribers,
      totalEarnings,
      totalCustomers,
      completedOrders,
    ] = await Promise.all([
      this.orderModel.countDocuments({ status: { $ne: 'cancelled' } }),
      this.newsletterModel.countDocuments({ isActive: true }),
      this.orderModel.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      this.userModel.countDocuments({ role: 'user' }),
      this.orderModel.countDocuments({ status: 'delivered' }),
    ]);

    const overallData = [
      { name: 'Total Orders', value: totalOrders },
      { name: 'Total Mails', value: totalNewsletterSubscribers },
      { name: 'Total Earning', value: totalEarnings[0]?.total || 0 },
      { name: 'Total Customer', value: totalCustomers },
      { name: 'Completed Orders', value: completedOrders },
    ];

    // Get today's earnings
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayEarnings = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart, $lte: todayEnd },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]);

    const summary = {
      earningsToday: todayEarnings[0]?.total || 0,
      earningsOverall: totalEarnings[0]?.total || 0,
      totalCustomers: totalCustomers,
      ordersTotal: totalOrders,
    };

    return {
      earningsData,
      customerData,
      overallData,
      summary,
    };
  }
}
