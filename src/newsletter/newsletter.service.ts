import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Newsletter, NewsletterDocument } from './schemas/newsletter.schema';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';
import { QueryNewsletterDto } from './dto/query-newsletter.dto';
import { VerifyNewsletterDto, UnsubscribeNewsletterDto } from './dto/verify-newsletter.dto';
import * as crypto from 'crypto';

@Injectable()
export class NewsletterService {
  constructor(
    @InjectModel(Newsletter.name) private newsletterModel: Model<NewsletterDocument>,
  ) {}

  async subscribe(subscribeDto: SubscribeNewsletterDto): Promise<{ message: string; verificationToken?: string }> {
    const { email, preferences = [], source = 'website' } = subscribeDto;

    // Check if email already exists
    const existingSubscription = await this.newsletterModel.findOne({ email }).exec();

    if (existingSubscription) {
      if (existingSubscription.isActive) {
        throw new ConflictException('Email is already subscribed to newsletter');
      } else {
        // Reactivate subscription
        existingSubscription.isActive = true;
        existingSubscription.preferences = preferences;
        existingSubscription.source = source;
        existingSubscription.unsubscribedAt = undefined;
        await existingSubscription.save();
        
        return {
          message: 'Email subscription reactivated successfully',
        };
      }
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create new subscription
    const newSubscription = new this.newsletterModel({
      email,
      preferences,
      source,
      verificationToken,
      isActive: true,
      isVerified: false,
    });

    await newSubscription.save();

    return {
      message: 'Successfully subscribed to newsletter. Please check your email for verification.',
      verificationToken, // In production, send this via email instead of returning it
    };
  }

  async verifyEmail(verifyDto: VerifyNewsletterDto): Promise<{ message: string }> {
    const { token } = verifyDto;

    const subscription = await this.newsletterModel.findOne({ verificationToken: token }).exec();

    if (!subscription) {
      throw new NotFoundException('Invalid verification token');
    }

    if (subscription.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    subscription.isVerified = true;
    subscription.verifiedAt = new Date();
    subscription.verificationToken = undefined;
    await subscription.save();

    return {
      message: 'Email verified successfully. You will now receive our newsletter.',
    };
  }

  async unsubscribe(unsubscribeDto: UnsubscribeNewsletterDto): Promise<{ message: string }> {
    const { token } = unsubscribeDto;

    const subscription = await this.newsletterModel.findOne({ unsubscribeToken: token }).exec();

    if (!subscription) {
      throw new NotFoundException('Invalid unsubscribe token');
    }

    subscription.isActive = false;
    subscription.unsubscribedAt = new Date();
    await subscription.save();

    return {
      message: 'Successfully unsubscribed from newsletter',
    };
  }

  async unsubscribeByEmail(email: string): Promise<{ message: string }> {
    const subscription = await this.newsletterModel.findOne({ email }).exec();

    if (!subscription) {
      throw new NotFoundException('Email not found in newsletter subscriptions');
    }

    if (!subscription.isActive) {
      throw new BadRequestException('Email is already unsubscribed');
    }

    subscription.isActive = false;
    subscription.unsubscribedAt = new Date();
    await subscription.save();

    return {
      message: 'Successfully unsubscribed from newsletter',
    };
  }

  async findAll(queryDto: QueryNewsletterDto): Promise<{ subscribers: Newsletter[]; total: number; page: number; totalPages: number }> {
    const { 
      search, 
      isActive, 
      isVerified,
      source,
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = queryDto;

    // Build filter object
    const filter: any = {};

    // Search by email
    if (search) {
      filter.email = { $regex: search, $options: 'i' };
    }

    // Filter by active status
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    // Filter by verified status
    if (isVerified !== undefined) {
      filter.isVerified = isVerified;
    }

    // Filter by source
    if (source) {
      filter.source = source;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [subscribers, total] = await Promise.all([
      this.newsletterModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.newsletterModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      subscribers,
      total,
      page,
      totalPages,
    };
  }

  async findOne(id: string): Promise<Newsletter> {
    const subscriber = await this.newsletterModel.findById(id).exec();
    if (!subscriber) {
      throw new NotFoundException(`Newsletter subscriber with ID ${id} not found`);
    }
    return subscriber;
  }

  async remove(id: string): Promise<void> {
    const result = await this.newsletterModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Newsletter subscriber with ID ${id} not found`);
    }
  }

  async getNewsletterStats(): Promise<{ 
    totalSubscribers: number; 
    activeSubscribers: number; 
    verifiedSubscribers: number; 
    unverifiedSubscribers: number;
    totalEmailsSent: number;
  }> {
    const [totalSubscribers, activeSubscribers, verifiedSubscribers, unverifiedSubscribers, totalEmailsResult] = await Promise.all([
      this.newsletterModel.countDocuments().exec(),
      this.newsletterModel.countDocuments({ isActive: true }).exec(),
      this.newsletterModel.countDocuments({ isActive: true, isVerified: true }).exec(),
      this.newsletterModel.countDocuments({ isActive: true, isVerified: false }).exec(),
      this.newsletterModel.aggregate([
        { $group: { _id: null, totalEmails: { $sum: '$emailCount' } } }
      ]).exec(),
    ]);

    const totalEmailsSent = totalEmailsResult.length > 0 ? totalEmailsResult[0].totalEmails : 0;

    return {
      totalSubscribers,
      activeSubscribers,
      verifiedSubscribers,
      unverifiedSubscribers,
      totalEmailsSent,
    };
  }

  async getActiveSubscribers(): Promise<Newsletter[]> {
    return this.newsletterModel
      .find({ isActive: true, isVerified: true })
      .sort({ createdAt: -1 })
      .exec();
  }

  async incrementEmailCount(email: string): Promise<void> {
    await this.newsletterModel.updateOne(
      { email, isActive: true },
      { $inc: { emailCount: 1 } }
    ).exec();
  }

  async generateUnsubscribeToken(email: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    
    await this.newsletterModel.updateOne(
      { email },
      { unsubscribeToken: token }
    ).exec();

    return token;
  }
}
