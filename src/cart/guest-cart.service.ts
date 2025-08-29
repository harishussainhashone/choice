import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument, CartItem } from './schemas/cart.schema';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ProductsService } from '../products/products.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GuestCartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    private productsService: ProductsService,
  ) {}

  private generateGuestId(): string {
    return `guest_${uuidv4()}`;
  }

  async getGuestCart(guestId: string): Promise<Cart> {
    let cart = await this.cartModel.findOne({ userId: guestId }).exec();
    
    if (!cart) {
      // Create empty guest cart if it doesn't exist
      cart = new this.cartModel({
        userId: guestId,
        items: [],
        totalAmount: 0,
        totalItems: 0,
      });
      await cart.save();
    }
    
    return cart;
  }

  async addToGuestCart(guestId: string, addToCartDto: AddToCartDto): Promise<Cart> {
    const { productId, quantity } = addToCartDto;

    // Verify product exists
    const product = await this.productsService.findOne(productId);
    if (!product.isActive) {
      throw new BadRequestException('Product is not available');
    }

    let cart = await this.cartModel.findOne({ userId: guestId }).exec();
    
    if (!cart) {
      // Create new guest cart if it doesn't exist
      cart = new this.cartModel({
        userId: guestId,
        items: [],
        totalAmount: 0,
        totalItems: 0,
      });
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId === productId
    );

    if (existingItemIndex > -1) {
      // Update existing item quantity
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].totalPrice = 
        cart.items[existingItemIndex].productPrice * cart.items[existingItemIndex].quantity;
    } else {
      // Add new item
      const newItem: CartItem = {
        productId: productId,
        productName: product.name,
        productPrice: product.price,
        productThumbnail: product.thumbnail,
        quantity,
        totalPrice: product.price * quantity,
      };
      cart.items.push(newItem);
    }

    // Recalculate totals
    cart.totalAmount = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.updatedAt = new Date();

    return cart.save();
  }

  async updateGuestCartItem(
    guestId: string, 
    productId: string, 
    updateCartItemDto: UpdateCartItemDto
  ): Promise<Cart> {
    const { quantity } = updateCartItemDto;

    const cart = await this.cartModel.findOne({ userId: guestId }).exec();
    if (!cart) {
      throw new BadRequestException('Guest cart not found');
    }

    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    if (itemIndex === -1) {
      throw new BadRequestException('Product not found in guest cart');
    }

    // Update item quantity and total price
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].totalPrice = cart.items[itemIndex].productPrice * quantity;

    // Recalculate totals
    cart.totalAmount = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.updatedAt = new Date();

    return cart.save();
  }

  async removeFromGuestCart(guestId: string, productId: string): Promise<Cart> {
    const cart = await this.cartModel.findOne({ userId: guestId }).exec();
    if (!cart) {
      throw new BadRequestException('Guest cart not found');
    }

    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    if (itemIndex === -1) {
      throw new BadRequestException('Product not found in guest cart');
    }

    // Remove item
    cart.items.splice(itemIndex, 1);

    // Recalculate totals
    cart.totalAmount = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.updatedAt = new Date();

    return cart.save();
  }

  async clearGuestCart(guestId: string): Promise<Cart> {
    const cart = await this.cartModel.findOne({ userId: guestId }).exec();
    if (!cart) {
      throw new BadRequestException('Guest cart not found');
    }

    cart.items = [];
    cart.totalAmount = 0;
    cart.totalItems = 0;
    cart.updatedAt = new Date();

    return cart.save();
  }

  async getGuestCartItemCount(guestId: string): Promise<number> {
    const cart = await this.cartModel.findOne({ userId: guestId }).exec();
    return cart ? cart.totalItems : 0;
  }

  async convertGuestCartToUserCart(guestId: string, userId: string): Promise<Cart> {
    // Find guest cart
    const guestCart = await this.cartModel.findOne({ userId: guestId }).exec();
    if (!guestCart || guestCart.items.length === 0) {
      throw new BadRequestException('Guest cart is empty or not found');
    }

    // Check if user already has a cart
    let userCart = await this.cartModel.findOne({ userId }).exec();
    
    if (userCart) {
      // Merge guest cart items into user cart
      for (const guestItem of guestCart.items) {
        const existingItemIndex = userCart.items.findIndex(
          item => item.productId === guestItem.productId
        );

        if (existingItemIndex > -1) {
          // Update existing item quantity
          userCart.items[existingItemIndex].quantity += guestItem.quantity;
          userCart.items[existingItemIndex].totalPrice = 
            userCart.items[existingItemIndex].productPrice * userCart.items[existingItemIndex].quantity;
        } else {
          // Add new item
          userCart.items.push(guestItem);
        }
      }

      // Recalculate totals
      userCart.totalAmount = userCart.items.reduce((sum, item) => sum + item.totalPrice, 0);
      userCart.totalItems = userCart.items.reduce((sum, item) => sum + item.quantity, 0);
      userCart.updatedAt = new Date();

      // Delete guest cart
      await this.cartModel.deleteOne({ userId: guestId }).exec();

      return userCart.save();
    } else {
      // Create new user cart with guest cart data
      userCart = new this.cartModel({
        userId,
        items: guestCart.items,
        totalAmount: guestCart.totalAmount,
        totalItems: guestCart.totalItems,
      });

      // Delete guest cart
      await this.cartModel.deleteOne({ userId: guestId }).exec();

      return userCart.save();
    }
  }
}
