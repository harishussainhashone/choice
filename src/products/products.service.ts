import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
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
    const skip = (page - 1) * limit;

    // Execute queries
    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      products,
      total,
      page,
      totalPages,
    };
  }

  async findOne(id: string, includeRelated: boolean = false): Promise<Product | { product: Product; relatedProducts: Product[] }> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (includeRelated) {
      const relatedProducts = await this.getRelatedProducts(id, 4);
      return {
        product,
        relatedProducts
      };
    }

    return product;
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
}
