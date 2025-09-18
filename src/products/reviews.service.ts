import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  // User submits a review
  async createReview(userId: string, createReviewDto: CreateReviewDto): Promise<Review> {
    const { productId, rating, comment } = createReviewDto;

    // Check if product exists
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user already reviewed this product
    const existingReview = await this.reviewModel.findOne({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    // Create new review
    const review = new this.reviewModel({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
      rating,
      comment,
    });

    return await review.save();
  }

  // Get user's review for a specific product
  async getUserReview(userId: string, productId: string): Promise<Review | null> {
    return await this.reviewModel.findOne({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
    });
  }

  // Get all reviews for a product (approved only)
  async getProductReviews(productId: string): Promise<Review[]> {
    return await this.reviewModel
      .find({
        productId: new Types.ObjectId(productId),
        isApproved: true,
        isRejected: false,
      })
      .populate('userId', 'name username')
      .sort({ createdAt: -1 })
      .exec();
  }

  // Admin: Get all pending reviews with product details
  async getPendingReviews(): Promise<any[]> {
    const reviews = await this.reviewModel
      .find({
        isApproved: false,
        isRejected: false,
      })
      .populate('userId', 'name username email')
      .populate('productId', 'name thumbnail price') 
      .sort({ createdAt: -1 })
      .exec();
  
    return reviews
      .filter(review => review.userId && review.productId) 
      .map((review: any) => ({
        _id: review._id,
        user: review.userId ? {
          _id: review.userId._id,
          name: review.userId.name,
          username: review.userId.username,
          email: review.userId.email,
        } : null,
        product: review.productId ? {
          _id: review.productId._id,
          name: review.productId.name,
          thumbnail: review.productId.thumbnail, 
          price: review.productId.price,
        } : null,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      }));
  }

  // Admin: Get all reviews (approved, rejected, pending)
  async getAllReviews(): Promise<any[]> {
    const reviews = await this.reviewModel
      .find()
      .populate('userId', 'name username email')
      .populate('productId', 'name thumbnail price') 
      .sort({ createdAt: -1 })
      .exec();
  
    return reviews
      .filter(review => review.userId && review.productId) 
      .map((review: any) => ({
        _id: review._id,
        user: review.userId ? {
          _id: review.userId._id,
          name: review.userId.name,
          username: review.userId.username,
          email: review.userId.email,
        } : null,
        product: review.productId ? {
          _id: review.productId._id,
          name: review.productId.name,
          thumbnail: review.productId.thumbnail,
          price: review.productId.price,
        } : null,
        rating: review.rating,
        comment: review.comment,
        isApproved: review.isApproved,
        isRejected: review.isRejected,
        rejectionReason: review.rejectionReason,
        approvedBy: review.approvedBy,
        approvedAt: review.approvedAt,
        createdAt: review.createdAt,
      }));
  }

  // Admin: Approve a review
  async approveReview(reviewId: string, adminId: string): Promise<Review> {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.isApproved) {
      throw new BadRequestException('Review is already approved');
    }

    review.isApproved = true;
    review.isRejected = false;
    review.rejectionReason = undefined;
    review.approvedBy = new Types.ObjectId(adminId);
    review.approvedAt = new Date();

    return await review.save();
  }

  // Admin: Reject a review
  async rejectReview(reviewId: string, adminId: string, rejectionReason: string): Promise<Review> {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.isRejected) {
      throw new BadRequestException('Review is already rejected');
    }

    review.isRejected = true;
    review.isApproved = false;
    review.rejectionReason = rejectionReason;
    review.approvedBy = new Types.ObjectId(adminId);
    review.approvedAt = new Date();

    return await review.save();
  }

  // Admin: Delete a review
  async deleteReview(reviewId: string): Promise<void> {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.reviewModel.findByIdAndDelete(reviewId);
  }

  // Get review statistics for a product
  async getProductReviewStats(productId: string): Promise<any> {
    const stats = await this.reviewModel.aggregate([
      {
        $match: {
          productId: new Types.ObjectId(productId),
          isApproved: true,
          isRejected: false,
        },
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingCounts: {
            $push: '$rating',
          },
        },
      },
    ]);

    if (stats.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const ratingCounts = stats[0].ratingCounts.reduce((acc, rating) => {
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {});

    return {
      totalReviews: stats[0].totalReviews,
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      ratingDistribution: {
        1: ratingCounts[1] || 0,
        2: ratingCounts[2] || 0,
        3: ratingCounts[3] || 0,
        4: ratingCounts[4] || 0,
        5: ratingCounts[5] || 0,
      },
    };
  }
}
