import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Product } from './schemas/product.schema';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product (Admin only)' })
  @ApiResponse({ 
    status: 201, 
    description: 'Product created successfully',
    type: Product,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 409, description: 'Conflict - product name already exists' })
  async create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of products with pagination info',
    schema: {
      type: 'object',
      properties: {
        products: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
        total: { type: 'number' },
        page: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async findAll(@Query() queryDto: QueryProductDto) {
    return this.productsService.findAll(queryDto);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of products to return' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of featured products',
    type: [Product],
  })
  async getFeaturedProducts(@Query('limit') limit: number = 10): Promise<Product[]> {
    return this.productsService.getFeaturedProducts(limit);
  }

  @Get('new-arrivals')
  @ApiOperation({ summary: 'Get new arrival products' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of products to return' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of new arrival products',
    type: [Product],
  })
  async getNewArrivals(@Query('limit') limit: number = 10): Promise<Product[]> {
    return this.productsService.getNewArrivals(limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products by name, description, or short description' })
  @ApiQuery({ name: 'q', required: true, description: 'Search term' })
  @ApiResponse({ 
    status: 200, 
    description: 'Search results with pagination',
    schema: {
      type: 'object',
      properties: {
        products: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
        total: { type: 'number' },
        page: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async searchProducts(@Query('q') searchTerm: string, @Query() queryDto: QueryProductDto) {
    return this.productsService.searchProducts(searchTerm, queryDto);
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Products in category with pagination',
    schema: {
      type: 'object',
      properties: {
        products: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
        total: { type: 'number' },
        page: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async findByCategory(@Param('categoryId') categoryId: string, @Query() queryDto: QueryProductDto) {
    return this.productsService.findByCategory(categoryId, queryDto);
  }



  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID with optional related products and reviews' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiQuery({ name: 'includeRelated', required: false, type: Boolean, description: 'Include 4 related products (default: false)' })
  @ApiQuery({ name: 'includeReviews', required: false, type: Boolean, description: 'Include product reviews and stats (default: false)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Product found with optional related products and reviews',
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/Product' },
        {
          type: 'object',
          properties: {
            product: { $ref: '#/components/schemas/Product' },
            relatedProducts: { 
              type: 'array', 
              items: { $ref: '#/components/schemas/Product' } 
            },
            reviews: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  user: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      name: { type: 'string' },
                      username: { type: 'string' }
                    }
                  },
                  rating: { type: 'number' },
                  comment: { type: 'string' },
                  createdAt: { type: 'string' }
                }
              }
            },
            reviewStats: {
              type: 'object',
              properties: {
                totalReviews: { type: 'number' },
                averageRating: { type: 'number' },
                ratingDistribution: {
                  type: 'object',
                  properties: {
                    '5': { type: 'number' },
                    '4': { type: 'number' },
                    '3': { type: 'number' },
                    '2': { type: 'number' },
                    '1': { type: 'number' }
                  }
                }
              }
            }
          },
        }
      ]
    }
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(
    @Param('id') id: string,
    @Query('includeRelated') includeRelated: boolean = false,
    @Query('includeReviews') includeReviews: boolean = false
  ): Promise<Product | { product: Product; relatedProducts: Product[] } | { product: Product; reviews: any[]; reviewStats: any } | { product: Product; relatedProducts: Product[]; reviews: any[]; reviewStats: any }> {
    return this.productsService.findOne(id, includeRelated, includeReviews);
  }

  @Get('admin/:id')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get product by ID with full details (Admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Product found with complete details including admin-specific information',
    schema: {
      type: 'object',
      properties: {
        product: { $ref: '#/components/schemas/Product' },
        analytics: {
          type: 'object',
          properties: {
            totalViews: { type: 'number' },
            totalSales: { type: 'number' },
            totalRevenue: { type: 'number' },
            averageRating: { type: 'number' },
            totalReviews: { type: 'number' },
            stockStatus: { type: 'string' }
          }
        },
        recentReviews: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  username: { type: 'string' },
                  email: { type: 'string' }
                }
              },
              rating: { type: 'number' },
              comment: { type: 'string' },
              isApproved: { type: 'boolean' },
              createdAt: { type: 'string' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductForAdmin(@Param('id') id: string) {
    return this.productsService.getProductForAdmin(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update product by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Product updated successfully',
    type: Product,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Conflict - product name already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.update(id, updateProductDto);
  }

  @Patch(':id/thumbnail')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update product thumbnail (Admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Product thumbnail updated successfully',
    type: Product,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateThumbnail(
    @Param('id') id: string,
    @Body('thumbnailUrl') thumbnailUrl: string,
  ): Promise<Product> {
    return this.productsService.updateThumbnail(id, thumbnailUrl);
  }

  @Post(':id/images')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Add images to product (Admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Images added successfully',
    type: Product,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async addImages(
    @Param('id') id: string,
    @Body('imageUrls') imageUrls: string[],
  ): Promise<Product> {
    return this.productsService.addImages(id, imageUrls);
  }

  @Delete(':id/images')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Remove image from product (Admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Image removed successfully',
    type: Product,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async removeImage(
    @Param('id') id: string,
    @Body('imageUrl') imageUrl: string,
  ): Promise<Product> {
    return this.productsService.removeImage(id, imageUrl);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete product by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 204, description: 'Product deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.productsService.remove(id);
  }

  @Post('clone-all')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clone all existing products multiple times (Admin only)' })
  @ApiQuery({ name: 'cloneCount', required: false, type: Number, description: 'Number of times to clone each product (default: 20000)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Products cloned successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        totalCloned: { type: 'number' },
        originalCount: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'No products found to clone' })
  @ApiResponse({ status: 500, description: 'Internal server error during cloning' })
  async cloneAllProducts(@Query('cloneCount') cloneCount: number = 20000): Promise<{ message: string; totalCloned: number; originalCount: number }> {
    return this.productsService.cloneAllProducts(cloneCount);
  }
}
