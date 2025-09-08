import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { Review, ReviewDocument } from './schemas/review.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Check if product with same name already exists
    const existingProduct = await this.productModel.findOne({
      name: createProductDto.name,
    });

    if (existingProduct) {
      throw new ConflictException('Product with this name already exists');
    }

    const newProduct = new this.productModel(createProductDto);
    return newProduct.save();
  }

  async findAll(queryDto: QueryProductDto): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
    const { 
      search, 
      categoryId, 
      minPrice, 
      maxPrice, 
      isActive, 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = queryDto;

    // Limit pagination to prevent performance issues
    const maxPage = 10000; // Maximum page limit
    const maxLimit = 100; // Maximum items per page
    const safePage = Math.min(Math.max(page, 1), maxPage);
    const safeLimit = Math.min(Math.max(limit, 1), maxLimit);

    // Build filter object
    const filter: any = {};

    // Search by name, description, or short description
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by category
    if (categoryId) {
      filter.categoryId = categoryId;
    }

    // Filter by price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    // Filter by active status
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (safePage - 1) * safeLimit;

    // For large datasets, use estimated count instead of exact count for better performance
    let total: number;
    if (skip > 50000) {
      // For deep pagination, use estimated count
      total = await this.productModel.estimatedDocumentCount();
    } else {
      // For early pages, use exact count
      total = await this.productModel.countDocuments(filter).exec();
    }

    // Execute query with timeout and memory optimization
    const products = await this.productModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(safeLimit)
      .lean() // Use lean() for better performance with large datasets
      .exec();

    const totalPages = Math.ceil(total / safeLimit);

    return {
      products,
      total,
      page: safePage,
      totalPages,
    };
  }

  async findOne(id: string, includeRelated: boolean = false, includeReviews: boolean = false): Promise<Product | { product: Product; relatedProducts: Product[] } | { product: Product; reviews: any[]; reviewStats: any } | { product: Product; relatedProducts: Product[]; reviews: any[]; reviewStats: any }> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    let result: any = { product };

    if (includeRelated) {
      const relatedProducts = await this.getRelatedProducts(id, 4);
      result.relatedProducts = relatedProducts;
    }

    if (includeReviews) {
      const reviews = await this.getProductReviews(id);
      const reviewStats = await this.getProductReviewStats(id);
      result.reviews = reviews;
      result.reviewStats = reviewStats;
    }

    // If no additional data is requested, return just the product
    if (!includeRelated && !includeReviews) {
      return product;
    }

    return result;
  }

  async findByCategory(categoryId: string, queryDto: QueryProductDto): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
    const queryDtoWithCategory = { ...queryDto, categoryId };
    return this.findAll(queryDtoWithCategory);
  }

  async searchProducts(searchTerm: string, queryDto: QueryProductDto): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
    const queryDtoWithSearch = { ...queryDto, search: searchTerm };
    return this.findAll(queryDtoWithSearch);
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    // Check if name is being updated and if it conflicts with existing product
    if (updateProductDto.name) {
      const existingProduct = await this.productModel.findOne({
        name: updateProductDto.name,
        _id: { $ne: id }, // Exclude current product from check
      });

      if (existingProduct) {
        throw new ConflictException('Product with this name already exists');
      }
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return updatedProduct;
  }



  async addImages(id: string, imageUrls: string[]): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    product.images = [...product.images, ...imageUrls];
    return product.save();
  }

  async removeImage(id: string, imageUrl: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    product.images = product.images.filter(img => img !== imageUrl);
    return product.save();
  }

  async updateThumbnail(id: string, thumbnailUrl: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    product.thumbnail = thumbnailUrl;
    return product.save();
  }

  async remove(id: string): Promise<void> {
    const result = await this.productModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }



  async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
    return this.productModel
      .find({ isActive: true })
      .sort({ rating: -1, createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getNewArrivals(limit: number = 10): Promise<Product[]> {
    return this.productModel
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
    // First get the current product to find its category and price
    const currentProduct = await this.productModel.findById(productId).exec();
    if (!currentProduct) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Find related products based on:
    // 1. Same category (highest priority)
    // 2. Similar price range (±20% of current product price)
    // 3. Active products only
    // 4. Exclude the current product
    const priceRange = currentProduct.price * 0.2; // 20% range
    const minPrice = currentProduct.price - priceRange;
    const maxPrice = currentProduct.price + priceRange;

    const relatedProducts = await this.productModel
      .find({
        _id: { $ne: productId }, // Exclude current product
        isActive: true,
        $or: [
          // Same category (highest priority)
          { categoryId: currentProduct.categoryId },
          // Similar price range
          {
            price: { $gte: minPrice, $lte: maxPrice },
            categoryId: { $ne: currentProduct.categoryId } // Different category but similar price
          }
        ]
      })
      .sort({
        // Priority: same category first, then by rating, then by creation date
        categoryId: currentProduct.categoryId ? 1 : -1,
        rating: -1,
        createdAt: -1
      })
      .limit(limit)
      .exec();

    // If we don't have enough related products, fill with other active products
    if (relatedProducts.length < limit) {
      const remainingCount = limit - relatedProducts.length;
      const additionalProducts = await this.productModel
        .find({
          _id: { $nin: [...relatedProducts.map(p => p._id), productId] },
          isActive: true
        })
        .sort({ rating: -1, createdAt: -1 })
        .limit(remainingCount)
        .exec();

      relatedProducts.push(...additionalProducts);
    }

    return relatedProducts;
  }

  // Review methods
  async getProductReviews(productId: string): Promise<any[]> {
    const reviews = await this.reviewModel
      .find({
        productId: productId,
        isApproved: true,
        isRejected: false,
      })
      .populate('userId', 'name username')
      .sort({ createdAt: -1 })
      .exec();

    return reviews.map((review: any) => ({
      _id: review._id,
      user: {
        _id: review.userId._id,
        name: review.userId.name,
        username: review.userId.username,
      },
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    }));
  }

  async getProductReviewStats(productId: string): Promise<any> {
    const stats = await this.reviewModel.aggregate([
      {
        $match: {
          productId: productId,
          isApproved: true,
          isRejected: false,
        },
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating',
          },
        },
      },
    ]);

    if (stats.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

    const result = stats[0];
    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    result.ratingDistribution.forEach((rating: number) => {
      ratingDistribution[rating as keyof typeof ratingDistribution]++;
    });

    return {
      totalReviews: result.totalReviews,
      averageRating: Math.round(result.averageRating * 10) / 10, // Round to 1 decimal
      ratingDistribution,
    };
  }

  // Clone products method
  async cloneAllProducts(cloneCount: number = 20000): Promise<{ message: string; totalCloned: number; originalCount: number }> {
    try {
      // Get all existing products
      const existingProducts = await this.productModel.find({}).exec();
      
      if (existingProducts.length === 0) {
        throw new NotFoundException('No products found to clone');
      }

      const originalCount = existingProducts.length;
      let totalCloned = 0;

      // Process each original product
      for (const originalProduct of existingProducts) {
        const productsToInsert: any[] = [];
        
        // Create cloneCount copies of each product
        for (let i = 1; i <= cloneCount; i++) {
          const { _id, __v, createdAt, updatedAt, ...rest } = originalProduct.toObject();
          const clonedProduct = {
            ...rest,
            name: `${originalProduct.name} - Clone ${i}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          productsToInsert.push(clonedProduct);
          
          // Insert in batches of 1000 to avoid memory issues
          if (productsToInsert.length >= 1000) {
            await this.productModel.insertMany(productsToInsert);
            totalCloned += productsToInsert.length;
            productsToInsert.length = 0; // Clear array
            console.log(`Cloned ${totalCloned} products so far...`);
          }
        }
        
        // Insert remaining products
        if (productsToInsert.length > 0) {
          await this.productModel.insertMany(productsToInsert);
          totalCloned += productsToInsert.length;
        }
        
        console.log(`Completed cloning product: ${originalProduct.name}`);
      }

      return {
        message: `Successfully cloned ${originalCount} products ${cloneCount} times each`,
        totalCloned,
        originalCount,
      };
    } catch (error) {
      console.error('Error cloning products:', error);
      throw error;
    }
  }
}
