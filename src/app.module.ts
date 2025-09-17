import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { FaqsModule } from './faqs/faqs.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { CustomersModule } from './customers/customers.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://harishussainhashone_db_user:jRc5krGYic5mblHQ@cluster0.aye5bby.mongodb.net/'),
    AuthModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    FaqsModule,
    NewsletterModule,
    CustomersModule,
    AdminModule,
  ],
  providers: [AppService],
})
export class AppModule {}
