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
  @ApiOperation({ summary: 'Get user cart' })
  @ApiResponse({ 
    status: 200, 
    description: 'User cart retrieved successfully',
    type: Cart,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCart(@Request() req): Promise<Cart> {
    return this.cartService.getCart(req.user.userId);
  }

  @Post('add')
  @ApiOperation({ summary: 'Add product to cart' })
  @ApiResponse({ 
    status: 201, 
    description: 'Product added to cart successfully',
    type: Cart,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid product or quantity' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async addToCart(@Request() req, @Body() addToCartDto: AddToCartDto): Promise<Cart> {
    return this.cartService.addToCart(req.user.userId, addToCartDto);
  }

  @Patch('items/:productId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cart item updated successfully',
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
  @ApiOperation({ summary: 'Remove product from cart' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Product removed from cart successfully',
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
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear entire cart' })
  @ApiResponse({ status: 204, description: 'Cart cleared successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  async clearCart(@Request() req): Promise<void> {
    await this.cartService.clearCart(req.user.userId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get cart item count' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cart item count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCartItemCount(@Request() req): Promise<{ count: number }> {
    const count = await this.cartService.getCartItemCount(req.user.userId);
    return { count };
  }
}
