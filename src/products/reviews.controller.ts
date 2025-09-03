import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('Product Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // User endpoints
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a product review' })
  @ApiResponse({ status: 201, description: 'Review submitted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Product already reviewed' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async createReview(
    @Request() req,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return await this.reviewsService.createReview(req.user.userId, createReviewDto);
  }

  @Get('my-review/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user\'s review for a specific product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Review found' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async getMyReview(
    @Request() req,
    @Param('productId') productId: string,
  ) {
    return await this.reviewsService.getUserReview(req.user.userId, productId);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get all approved reviews for a product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  async getProductReviews(@Param('productId') productId: string) {
    return await this.reviewsService.getProductReviews(productId);
  }

  @Get('product/:productId/stats')
  @ApiOperation({ summary: 'Get review statistics for a product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getProductReviewStats(@Param('productId') productId: string) {
    return await this.reviewsService.getProductReviewStats(productId);
  }

  // Admin endpoints
  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all pending reviews (Admin only)' })
  @ApiResponse({ status: 200, description: 'Pending reviews retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getPendingReviews() {
    return await this.reviewsService.getPendingReviews();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all reviews (Admin only)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status: pending, approved, rejected' })
  @ApiResponse({ status: 200, description: 'All reviews retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAllReviews(@Query('status') status?: string) {
    const reviews = await this.reviewsService.getAllReviews();
    
    if (status) {
      switch (status.toLowerCase()) {
        case 'pending':
          return reviews.filter(review => !review.isApproved && !review.isRejected);
        case 'approved':
          return reviews.filter(review => review.isApproved);
        case 'rejected':
          return reviews.filter(review => review.isRejected);
        default:
          return reviews;
      }
    }
    
    return reviews;
  }

  @Put('admin/:reviewId/approve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a review (Admin only)' })
  @ApiParam({ name: 'reviewId', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review approved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async approveReview(
    @Request() req,
    @Param('reviewId') reviewId: string,
  ) {
    return await this.reviewsService.approveReview(reviewId, req.user.userId);
  }

  @Put('admin/:reviewId/reject')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a review (Admin only)' })
  @ApiParam({ name: 'reviewId', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review rejected successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async rejectReview(
    @Request() req,
    @Param('reviewId') reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    if (!updateReviewDto.rejectionReason) {
      throw new Error('Rejection reason is required');
    }
    return await this.reviewsService.rejectReview(
      reviewId,
      req.user.userId,
      updateReviewDto.rejectionReason,
    );
  }

  @Delete('admin/:reviewId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review (Admin only)' })
  @ApiParam({ name: 'reviewId', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async deleteReview(@Param('reviewId') reviewId: string) {
    await this.reviewsService.deleteReview(reviewId);
    return { message: 'Review deleted successfully' };
  }
}
