import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';

// Helper function to get server URLs from environment variables
function getServerUrls(): string[] {
  const servers = [
    process.env.SERVER_URL_1 || 'https://project.1stopwebsitesolution.com/choice-delivery',
    process.env.SERVER_URL_2 || 'http://localhost:3000',
  ].filter(Boolean); // Remove empty values
  
  return servers;
}

// Helper function to create Swagger config with dynamic servers
function createSwaggerConfig(title: string, description: string) {
  const config = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion('1.0')
    .addBearerAuth();
  
  // Add all server URLs dynamically
  getServerUrls().forEach(server => {
    config.addServer(server);
  });
  
  return config.build();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  app.setGlobalPrefix('api/v1');

  // Swagger for Auth
  const authConfig = createSwaggerConfig('Auth API', 'API documentation for authentication and user management');
  const authDoc = SwaggerModule.createDocument(app, authConfig, { include: [AuthModule] });
  SwaggerModule.setup('api/docs/auth', app, authDoc);

  // Swagger for Products
  const productsConfig = createSwaggerConfig('Products API', 'API documentation for product management');
  const productsDoc = SwaggerModule.createDocument(app, productsConfig, { include: [ProductsModule] });
  SwaggerModule.setup('choice-delivery/api/products', app, productsDoc);

  // Swagger for Reviews
  const reviewsConfig = createSwaggerConfig('Reviews API', 'API documentation for product reviews and ratings');
  const reviewsDoc = SwaggerModule.createDocument(app, reviewsConfig, { include: [ProductsModule] });
  SwaggerModule.setup('choice-delivery/api/reviews', app, reviewsDoc);

  // Swagger for Categories
  const categoriesConfig = createSwaggerConfig('Categories API', 'API documentation for category management (Admin only)');
  const categoriesDoc = SwaggerModule.createDocument(app, categoriesConfig, { include: [CategoriesModule] });
  SwaggerModule.setup('api/docs/categories', app, categoriesDoc);

  // Swagger for Cart
  const cartConfig = createSwaggerConfig('Cart API', 'API documentation for shopping cart functionality');
  const cartDoc = SwaggerModule.createDocument(app, cartConfig, { include: [CartModule] });
  SwaggerModule.setup('api/docs/cart', app, cartDoc);

  // Swagger for Orders
  const ordersConfig = createSwaggerConfig('Orders API', 'API documentation for order management');
  const ordersDoc = SwaggerModule.createDocument(app, ordersConfig, { include: [OrdersModule] });
  SwaggerModule.setup('api/docs/orders', app, ordersDoc);

  // Main API docs for all modules
  const mainConfig = createSwaggerConfig('Choice Delivery API', 'Complete API documentation for Choice Delivery application');
  const mainDoc = SwaggerModule.createDocument(app, mainConfig);
  SwaggerModule.setup('api/docs', app, mainDoc);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Available servers: ${getServerUrls().join(', ')}`);
  console.log(`Main Swagger docs: http://localhost:${port}/choice-delivery/api`);
  console.log(`Auth API docs: http://localhost:${port}/choice-delivery/api/auth`);
  console.log(`Products API docs: http://localhost:${port}/choice-delivery/api/products`);
  console.log(`Categories API docs: http://localhost:${port}/choice-delivery/api/categories`);
  console.log(`Cart API docs: http://localhost:${port}/choice-delivery/api/cart`);
  console.log(`Orders API docs: http://localhost:${port}/choice-delivery/api/orders`);
}

bootstrap();
