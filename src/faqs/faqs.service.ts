import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Faq, FaqDocument } from './schemas/faq.schema';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { QueryFaqDto } from './dto/query-faq.dto';

@Injectable()
export class FaqsService {
  constructor(
    @InjectModel(Faq.name) private faqModel: Model<FaqDocument>,
  ) {}

  async create(createFaqDto: CreateFaqDto): Promise<Faq> {
    const newFaq = new this.faqModel(createFaqDto);
    return newFaq.save();
  }

  async findAll(queryDto: QueryFaqDto): Promise<{ faqs: Faq[]; total: number; page: number; totalPages: number }> {
    const { 
      search, 
      isActive, 
      tag,
      page = 1, 
      limit = 10, 
      sortBy = 'order', 
      sortOrder = 'asc' 
    } = queryDto;

    // Build filter object
    const filter: any = {};

    // Search by question or answer
    if (search) {
      filter.$or = [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by active status
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    // Filter by tag
    if (tag) {
      filter.tags = { $in: [tag] };
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [faqs, total] = await Promise.all([
      this.faqModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.faqModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      faqs,
      total,
      page,
      totalPages,
    };
  }

  async findActiveFaqs(queryDto: QueryFaqDto): Promise<{ faqs: Faq[]; total: number; page: number; totalPages: number }> {
    // Force isActive to true for user-facing API
    const userQueryDto = { ...queryDto, isActive: true };
    return this.findAll(userQueryDto);
  }

  async findOne(id: string): Promise<Faq> {
    const faq = await this.faqModel.findById(id).exec();
    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }
    return faq;
  }

  async update(id: string, updateFaqDto: UpdateFaqDto): Promise<Faq> {
    const updatedFaq = await this.faqModel
      .findByIdAndUpdate(id, updateFaqDto, { new: true })
      .exec();

    if (!updatedFaq) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }

    return updatedFaq;
  }

  async remove(id: string): Promise<void> {
    const result = await this.faqModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }
  }

  async toggleStatus(id: string): Promise<Faq> {
    const faq = await this.faqModel.findById(id).exec();
    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }

    faq.isActive = !faq.isActive;
    return faq.save();
  }

  async updateOrder(id: string, order: number): Promise<Faq> {
    const faq = await this.faqModel.findById(id).exec();
    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }

    faq.order = order;
    return faq.save();
  }

  async incrementViewCount(id: string): Promise<Faq> {
    const faq = await this.faqModel.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).exec();

    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }

    return faq;
  }

  async getFaqStats(): Promise<{ totalFaqs: number; activeFaqs: number; inactiveFaqs: number; totalViews: number }> {
    const [totalFaqs, activeFaqs, inactiveFaqs, totalViewsResult] = await Promise.all([
      this.faqModel.countDocuments().exec(),
      this.faqModel.countDocuments({ isActive: true }).exec(),
      this.faqModel.countDocuments({ isActive: false }).exec(),
      this.faqModel.aggregate([
        { $group: { _id: null, totalViews: { $sum: '$viewCount' } } }
      ]).exec(),
    ]);

    const totalViews = totalViewsResult.length > 0 ? totalViewsResult[0].totalViews : 0;

    return {
      totalFaqs,
      activeFaqs,
      inactiveFaqs,
      totalViews,
    };
  }

  async getPopularFaqs(limit: number = 10): Promise<Faq[]> {
    return this.faqModel
      .find({ isActive: true })
      .sort({ viewCount: -1, order: 1 })
      .limit(limit)
      .exec();
  }

  async getFaqsByTag(tag: string, limit: number = 10): Promise<Faq[]> {
    return this.faqModel
      .find({ 
        isActive: true,
        tags: { $in: [tag] }
      })
      .sort({ order: 1, viewCount: -1 })
      .limit(limit)
      .exec();
  }
}
