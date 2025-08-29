import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderItem, OrderStatus } from './schemas/order.schema';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { CartService } from '../cart/cart.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private cartService: CartService,
  ) {}

  private generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random.toString().padStart(3, '0')}`;
  }

  private calculateTax(subtotal: number): number {
    // Simple tax calculation (you can customize this based on your requirements)
    return Math.round(subtotal * 0.1 * 100) / 100; // 10% tax
  }

  private calculateShippingCost(subtotal: number): number {
    // Simple shipping calculation (you can customize this based on your requirements)
    if (subtotal >= 100) {
      return 0; // Free shipping for orders over $100
    }
    return 10; // $10 shipping for orders under $100
  }

  async checkout(userId: string, checkoutDto: CheckoutDto): Promise<Order> {
    // Get user's cart
    const cart = await this.cartService.getCart(userId);
    
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty. Cannot proceed with checkout.');
    }

    // Calculate costs
    const subtotal = cart.totalAmount;
    const shippingCost = this.calculateShippingCost(subtotal);
    const tax = this.calculateTax(subtotal);
    const totalAmount = subtotal + shippingCost + tax;

    // Create order items from cart items
    const orderItems: OrderItem[] = cart.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      productPrice: item.productPrice,
      productThumbnail: item.productThumbnail,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
    }));

    // Create new order
    const order = new this.orderModel({
      orderNumber: this.generateOrderNumber(),
      userId,
      items: orderItems,
      shippingAddress: checkoutDto.shippingAddress,
      subtotal,
      shippingCost,
      tax,
      totalAmount,
      totalItems: cart.totalItems,
      status: OrderStatus.PENDING,
      paymentMethod: checkoutDto.paymentMethod || 'pending',
      paymentStatus: 'pending',
      notes: checkoutDto.notes,
    });

    const savedOrder = await order.save();

    // Clear the cart after successful checkout
    await this.cartService.clearCart(userId);

    return savedOrder;
  }

  async findAll(queryDto: QueryOrdersDto): Promise<{ orders: Order[]; total: number; page: number; totalPages: number }> {
    const { 
      status, 
      paymentStatus, 
      orderNumber, 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = queryDto;

    // Build filter object
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    if (orderNumber) {
      filter.orderNumber = { $regex: orderNumber, $options: 'i' };
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      orders,
      total,
      page,
      totalPages,
    };
  }

  async findUserOrders(userId: string, queryDto: QueryOrdersDto): Promise<{ orders: Order[]; total: number; page: number; totalPages: number }> {
    const queryDtoWithUser = { ...queryDto };
    const filter: any = { userId };

    // Add other filters
    if (queryDto.status) {
      filter.status = queryDto.status;
    }

    if (queryDto.paymentStatus) {
      filter.paymentStatus = queryDto.paymentStatus;
    }

    if (queryDto.orderNumber) {
      filter.orderNumber = { $regex: queryDto.orderNumber, $options: 'i' };
    }

    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = queryDto;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      orders,
      total,
      page,
      totalPages,
    };
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderModel.findOne({ orderNumber }).exec();
    if (!order) {
      throw new NotFoundException(`Order with number ${orderNumber} not found`);
    }
    return order;
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Update order status and other fields
    order.status = updateOrderStatusDto.status;
    if (updateOrderStatusDto.paymentStatus) {
      order.paymentStatus = updateOrderStatusDto.paymentStatus;
    }
    if (updateOrderStatusDto.notes) {
      order.notes = updateOrderStatusDto.notes;
    }
    order.updatedAt = new Date();

    return order.save();
  }

  async cancelOrder(id: string, userId: string): Promise<Order> {
    const order = await this.orderModel.findOne({ _id: id, userId }).exec();
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    order.status = OrderStatus.CANCELLED;
    order.updatedAt = new Date();

    return order.save();
  }

  async getOrderStats(userId?: string): Promise<any> {
    const filter = userId ? { userId } : {};

    const stats = await this.orderModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', OrderStatus.PENDING] }, 1, 0] }
          },
          confirmedOrders: {
            $sum: { $cond: [{ $eq: ['$status', OrderStatus.CONFIRMED] }, 1, 0] }
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$status', OrderStatus.DELIVERED] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', OrderStatus.CANCELLED] }, 1, 0] }
          },
        }
      }
    ]);

    return stats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      pendingOrders: 0,
      confirmedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
    };
  }
}
