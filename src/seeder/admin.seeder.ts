import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../auth/schemas/user.schema';

@Injectable()
export class AdminSeeder {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async seedAdmin() {
    try {
      // Check if admin already exists
      const existingAdmin = await this.userModel.findOne({ role: 'admin' });
      
      if (existingAdmin) {
        console.log('Admin user already exists');
        return;
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('admin123', saltRounds);

      // Create admin user
      const adminUser = new this.userModel({
        username: 'admin',
        name: 'Administrator',
        email: 'admin@example.com',
        password: hashedPassword,
        age: 30,
        role: 'admin',
      });

      await adminUser.save();
      console.log('Admin user created successfully');
      console.log('Email: admin@example.com');
      console.log('Password: admin123');
    } catch (error) {
      console.error('Error seeding admin user:', error);
    }
  }
}
