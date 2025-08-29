import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { CartController } from './cart.controller';
import { GuestCartController } from './guest-cart.controller';
import { CartService } from './cart.service';
import { GuestCartService } from './guest-cart.service';
import { Cart, CartSchema } from './schemas/cart.schema';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cart.name, schema: CartSchema }]),
    ProductsModule,
    JwtModule.register({
      secret: 'your-secret-key', // Use the same secret as in AuthModule
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [CartController, GuestCartController],
  providers: [CartService, GuestCartService],
  exports: [CartService, GuestCartService],
})
export class CartModule {}
