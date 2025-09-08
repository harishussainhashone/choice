import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto): Promise<{ message: string; user: any }> {
    const { username, email, password } = signupDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new this.userModel({
      username,
      email,
      password: hashedPassword,
      name: username, // Using username as name for now
      age: 0, // Default age
    });

    const savedUser = await newUser.save();

    // Remove password from response
    const { password: _, ...userWithoutPassword } = savedUser.toObject();

    return {
      message: 'User registered successfully',
      user: userWithoutPassword,
    };
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; user: any }> {
    const { email, password, firebaseToken } = loginDto;

    // Find user by email
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update Firebase token if provided
    if (firebaseToken) {
      user.firebaseToken = firebaseToken;
      await user.save();
    }

    // Generate JWT token
    const payload = { email: user.email, sub: user._id, userId: user._id, username: user.username, role: user.role };
    const access_token = this.jwtService.sign(payload);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toObject();

    return {
      access_token,
      user: userWithoutPassword,
    };
  }

  async adminLogin(adminLoginDto: AdminLoginDto): Promise<{ access_token: string; user: any }> {
    const { email, password, firebaseToken } = adminLoginDto;

    // Find admin by email
    const admin = await this.userModel.findOne({ email, role: 'admin' });

    if (!admin) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    // Update Firebase token if provided
    if (firebaseToken) {
      admin.firebaseToken = firebaseToken;
      await admin.save();
    }

    // Generate JWT token with admin role
    const payload = { email: admin.email, sub: admin._id, userId: admin._id, username: admin.username, role: admin.role };
    const access_token = this.jwtService.sign(payload);

    // Remove password from response
    const { password: _, ...adminWithoutPassword } = admin.toObject();

    return {
      access_token,
      user: adminWithoutPassword,
    };
  }

  async validateUser(email: string): Promise<any> {
    const user = await this.userModel.findOne({ email });
    if (user) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async logout(userId: string): Promise<{ message: string }> {
    // In a stateless JWT system, logout is typically handled on the client side
    // by removing the token from storage. However, we can add server-side logic here
    // such as logging the logout event, updating last logout time, etc.
    
    try {
      // Update user's last logout time and clear Firebase token
      await this.userModel.findByIdAndUpdate(userId, {
        lastLogoutAt: new Date(),
        firebaseToken: null, // Clear Firebase token on logout
      });

      return {
        message: 'Successfully logged out',
      };
    } catch (error) {
      // Even if user update fails, we still return success
      // because logout is primarily a client-side operation
      return {
        message: 'Successfully logged out',
      };
    }
  }

  async updateFirebaseToken(userId: string, firebaseToken: string): Promise<{ message: string }> {
    try {
      await this.userModel.findByIdAndUpdate(userId, {
        firebaseToken: firebaseToken,
      });

      return {
        message: 'Firebase token updated successfully',
      };
    } catch (error) {
      throw new UnauthorizedException('Failed to update Firebase token');
    }
  }

  async getUsersWithFirebaseTokens(): Promise<any[]> {
    return this.userModel.find({ 
      firebaseToken: { $ne: null, $exists: true } 
    }).select('_id email username firebaseToken').exec();
  }
}
