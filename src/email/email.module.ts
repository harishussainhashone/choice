// src/email/email.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { EmailLog, EmailLogSchema } from './schemas/email-log.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { AdminGuard } from '../auth/guards/admin.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailLog.name, schema: EmailLogSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule.register({
      secret: 'your-secret-key', // Use the same secret as in AuthModule
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService, AdminGuard],
  exports: [EmailService],
})
export class EmailModule {}