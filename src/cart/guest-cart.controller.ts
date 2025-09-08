import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import type { Response } from 'express';
import { GuestCartService } from './guest-cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Cart } from './schemas/cart.schema';

@ApiTags('guest-cart')
@Controller('guest-cart')
export class GuestCartController {
  constructor(private readonly guestCartService: GuestCartService) {}

  private getGuestIdFromHeader(req: Request): string {
    return req.headers['x-guest-id'] as string || this.generateGuestId();
  }

  private generateGuestId(): string {
    return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setGuestIdHeader(res: Response, guestId: string): void {
    res.setHeader('X-Guest-ID', guestId);
  }

  @Get()
  @ApiOperation({ summary: 'Get guest cart (includes item count)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Guest cart retrieved successfully with item count',
    type: Cart,
  })
  async getGuestCart(@Request() req, @Res({ passthrough: true }) res: Response): Promise<Cart> {
    const guestId = this.getGuestIdFromHeader(req);
    this.setGuestIdHeader(res, guestId);
    return this.guestCartService.getGuestCart(guestId);
  }

  @Post('add')
  @ApiOperation({ summary: 'Add product to guest cart (includes updated item count)' })
  @ApiResponse({ 
    status: 201, 
    description: 'Product added to guest cart successfully with updated item count',
    type: Cart,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid product or quantity' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async addToGuestCart(
    @Request() req, 
    @Body() addToCartDto: AddToCartDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<Cart> {
    const guestId = this.getGuestIdFromHeader(req);
    this.setGuestIdHeader(res, guestId);
    return this.guestCartService.addToGuestCart(guestId, addToCartDto);
  }

  @Patch('items/:productId')
  @ApiOperation({ summary: 'Update guest cart item quantity (includes updated item count)' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Guest cart item updated successfully with updated item count',
    type: Cart,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid quantity' })
  @ApiResponse({ status: 404, description: 'Guest cart or product not found' })
  async updateGuestCartItem(
    @Request() req,
    @Param('productId') productId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<Cart> {
    const guestId = this.getGuestIdFromHeader(req);
    this.setGuestIdHeader(res, guestId);
    return this.guestCartService.updateGuestCartItem(guestId, productId, updateCartItemDto);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Remove product from guest cart (includes updated item count)' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Product removed from guest cart successfully with updated item count',
    type: Cart,
  })
  @ApiResponse({ status: 404, description: 'Guest cart or product not found' })
  async removeFromGuestCart(
    @Request() req,
    @Param('productId') productId: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<Cart> {
    const guestId = this.getGuestIdFromHeader(req);
    this.setGuestIdHeader(res, guestId);
    return this.guestCartService.removeFromGuestCart(guestId, productId);
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear entire guest cart (includes updated item count)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Guest cart cleared successfully with updated item count (count will be 0)',
    type: Cart,
  })
  @ApiResponse({ status: 404, description: 'Guest cart not found' })
  async clearGuestCart(
    @Request() req,
    @Res({ passthrough: true }) res: Response
  ): Promise<Cart> {
    const guestId = this.getGuestIdFromHeader(req);
    this.setGuestIdHeader(res, guestId);
    return this.guestCartService.clearGuestCart(guestId);
  }

}
