import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminSeeder } from './admin.seeder';
import { User, UserSchema } from '../auth/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://harishussainhashone_db_user:jRc5krGYic5mblHQ@cluster0.aye5bby.mongodb.net/'),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [AdminSeeder],
  exports: [AdminSeeder],
})
export class SeederModule {}
