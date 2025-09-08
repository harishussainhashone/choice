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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Cart } from './schemas/cart.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get user cart (includes item count)' })
  @ApiResponse({ 
    status: 200, 
    description: 'User cart retrieved successfully with item count',
    type: Cart,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCart(@Request() req): Promise<Cart> {
    return this.cartService.getCart(req.user.userId);
  }

  @Post('add')
  @ApiOperation({ summary: 'Add product to cart (includes updated item count)' })
  @ApiResponse({ 
    status: 201, 
    description: 'Product added to cart successfully with updated item count',
    type: Cart,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid product or quantity' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async addToCart(@Request() req, @Body() addToCartDto: AddToCartDto): Promise<Cart> {
    return this.cartService.addToCart(req.user.userId, addToCartDto);
  }

  @Patch('items/:productId')
  @ApiOperation({ summary: 'Update cart item quantity (includes updated item count)' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cart item updated successfully with updated item count',
    type: Cart,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid quantity' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Cart or product not found' })
  async updateCartItem(
    @Request() req,
    @Param('productId') productId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<Cart> {
    return this.cartService.updateCartItem(req.user.userId, productId, updateCartItemDto);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Remove product from cart (includes updated item count)' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Product removed from cart successfully with updated item count',
    type: Cart,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Cart or product not found' })
  async removeFromCart(
    @Request() req,
    @Param('productId') productId: string,
  ): Promise<Cart> {
    return this.cartService.removeFromCart(req.user.userId, productId);
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear entire cart (includes updated item count)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cart cleared successfully with updated item count (count will be 0)',
    type: Cart,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  async clearCart(@Request() req): Promise<Cart> {
    return this.cartService.clearCart(req.user.userId);
  }

}