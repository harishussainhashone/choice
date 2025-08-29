<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# NestJS API Application

A simple NestJS application with RESTful API endpoints for user management.

## Features

- Authentication API endpoints (signup/login)
- JWT token-based authentication
- Password hashing with bcrypt
- Admin-only category management
- Product management with multiple images and thumbnails
- Advanced product search and filtering
- Role-based access control
- Swagger API documentation
- Input validation with class-validator
- MongoDB integration
- Built with TypeScript and NestJS

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running on localhost:27017)

## Installation

```bash
npm install
```

## Seeding Admin User

To create an admin user, run the seeder:

```bash
npm run seed:admin
```

This will create an admin user with:
- Email: `admin@example.com`
- Password: `admin123`
- Role: `admin`

## MongoDB Setup

Make sure MongoDB is running on your system. You can install MongoDB locally or use MongoDB Atlas.

For local MongoDB:
```bash
# Start MongoDB service
mongod
```

The application will connect to `mongodb://localhost:27017/nestjs-api`

## Running the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## API Endpoints

### Base URL
```
http://localhost:3000
```

### Swagger Documentation
```
http://localhost:3000/api
```

### General Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check
- `GET /info` - API information

### Authentication Endpoints

- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Login user
- `POST /auth/admin/login` - Admin login

### Category Endpoints (Admin Only)

- `GET /categories` - Get all categories
- `GET /categories/:id` - Get category by ID
- `POST /categories` - Create a new category
- `PATCH /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

### Product Endpoints

#### Public Endpoints
- `GET /products` - Get all products with filtering and pagination
- `GET /products/:id` - Get product by ID
- `GET /products/featured` - Get featured products
- `GET /products/new-arrivals` - Get new arrival products
- `GET /products/search` - Search products by name, description, or short description
- `GET /products/category/:categoryId` - Get products by category

#### Admin Only Endpoints
- `POST /products` - Create a new product
- `PATCH /products/:id` - Update product
- `PATCH /products/:id/thumbnail` - Update product thumbnail
- `POST /products/:id/images` - Add images to product
- `DELETE /products/:id/images` - Remove image from product
- `DELETE /products/:id` - Delete product

### Cart Endpoints (User Only)

- `GET /cart` - Get user cart
- `POST /cart/add` - Add product to cart
- `PATCH /cart/items/:productId` - Update cart item quantity
- `DELETE /cart/items/:productId` - Remove product from cart
- `DELETE /cart/clear` - Clear entire cart
- `GET /cart/count` - Get cart item count

### Order Endpoints

#### User Endpoints
- `POST /orders/checkout` - Checkout cart and create order
- `GET /orders/my-orders` - Get user orders
- `GET /orders/my-orders/:id` - Get user order by ID
- `PATCH /orders/my-orders/:id/cancel` - Cancel user order
- `GET /orders/my-orders/stats` - Get user order statistics

#### Admin Only Endpoints
- `GET /orders` - Get all orders
- `GET /orders/:id` - Get order by ID
- `GET /orders/number/:orderNumber` - Get order by order number
- `PATCH /orders/:id/status` - Update order status
- `GET /orders/stats/overview` - Get order statistics overview



### Example Requests

#### Register a new user
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_johnson",
    "email": "alice@example.com",
    "password": "password123"
  }'
```

#### Login user
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }'
```

#### Admin login
```bash
curl -X POST http://localhost:3000/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

#### Create a category (Admin only)
```bash
curl -X POST http://localhost:3000/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Electronics",
    "description": "Electronic devices and gadgets"
  }'
```

#### Get all categories (Admin only)
```bash
curl -X GET http://localhost:3000/categories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Create a product (Admin only)
```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "iPhone 15 Pro",
    "description": "Latest iPhone with advanced camera features, A17 Pro chip, and titanium design",
    "shortDescription": "Premium smartphone with advanced camera",
    "price": 999.99,
    "categoryId": "YOUR_CATEGORY_ID",
    "thumbnail": "https://example.com/images/iphone15-thumbnail.jpg",
    "images": [
      "https://example.com/images/iphone15-1.jpg",
      "https://example.com/images/iphone15-2.jpg"
    ],
    "additionalInfo": {
      "Color": "Titanium",
      "Storage": "256GB",
      "Screen Size": "6.1 inches",
      "Battery": "4000mAh"
    }
  }'
```

#### Get all products with filtering
```bash
curl -X GET "http://localhost:3000/products?search=iPhone&minPrice=500&maxPrice=1000&page=1&limit=10"
```

#### Get featured products
```bash
curl -X GET "http://localhost:3000/products/featured?limit=5"
```

#### Search products
```bash
curl -X GET "http://localhost:3000/products/search?q=iPhone&page=1&limit=10"
```

**Note**: Search works across product name, description, and short description fields.

#### Add images to product (Admin only)
```bash
curl -X POST http://localhost:3000/products/PRODUCT_ID/images \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "imageUrls": [
      "https://example.com/images/iphone15-3.jpg",
      "https://example.com/images/iphone15-4.jpg"
    ]
  }'
```

#### Get user cart
```bash
curl -X GET http://localhost:3000/cart \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

#### Add product to cart
```bash
curl -X POST http://localhost:3000/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{
    "productId": "PRODUCT_ID",
    "quantity": 2
  }'
```

#### Update cart item quantity
```bash
curl -X PATCH http://localhost:3000/cart/items/PRODUCT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{
    "quantity": 3
  }'
```

#### Remove product from cart
```bash
curl -X DELETE http://localhost:3000/cart/items/PRODUCT_ID \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

#### Clear entire cart
```bash
curl -X DELETE http://localhost:3000/cart/clear \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

#### Get cart item count
```bash
curl -X GET http://localhost:3000/cart/count \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

#### Checkout cart and create order
```bash
curl -X POST http://localhost:3000/orders/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{
    "shippingAddress": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "paymentMethod": "credit_card",
    "notes": "Please deliver in the morning"
  }'
```

#### Get user orders
```bash
curl -X GET "http://localhost:3000/orders/my-orders?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

#### Get user order by ID
```bash
curl -X GET http://localhost:3000/orders/my-orders/ORDER_ID \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

#### Cancel user order
```bash
curl -X PATCH http://localhost:3000/orders/my-orders/ORDER_ID/cancel \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

#### Get user order statistics
```bash
curl -X GET http://localhost:3000/orders/my-orders/stats \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

#### Get all orders (Admin only)
```bash
curl -X GET "http://localhost:3000/orders?status=pending&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Update order status (Admin only)
```bash
curl -X PATCH http://localhost:3000/orders/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "status": "confirmed",
    "paymentStatus": "paid",
    "notes": "Order confirmed and payment received"
  }'
```

#### Get order statistics overview (Admin only)
```bash
curl -X GET http://localhost:3000/orders/stats/overview \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```



## Project Structure

```
src/
├── app.controller.ts    # Main application controller
├── app.service.ts       # Main application service
├── app.module.ts        # Root application module
├── main.ts             # Application entry point
├── auth/
│   ├── auth.controller.ts  # Authentication controller
│   ├── auth.service.ts     # Authentication service
│   ├── auth.module.ts      # Authentication module
│   ├── schemas/
│   │   └── user.schema.ts  # User MongoDB schema
│   ├── dto/
│   │   ├── signup.dto.ts   # Signup validation
│   │   └── login.dto.ts    # Login validation
│   ├── strategies/
│   │   └── jwt.strategy.ts # JWT authentication strategy
│   └── guards/
│       └── admin.guard.ts  # Admin access guard
├── categories/
│   ├── categories.controller.ts  # Categories controller
│   ├── categories.service.ts     # Categories service
│   ├── categories.module.ts      # Categories module
│   ├── schemas/
│   │   └── category.schema.ts    # Category MongoDB schema
│   └── dto/
│       ├── create-category.dto.ts # Create category validation
│       └── update-category.dto.ts # Update category validation
└── products/
    ├── products.controller.ts  # Products controller
    ├── products.service.ts     # Products service
    ├── products.module.ts      # Products module
    ├── schemas/
    │   └── product.schema.ts    # Product MongoDB schema
    └── dto/
        ├── create-product.dto.ts # Create product validation
        ├── update-product.dto.ts # Update product validation
        └── query-product.dto.ts  # Product query validation
└── cart/
    ├── cart.controller.ts      # Cart controller
    ├── cart.service.ts         # Cart service
    ├── cart.module.ts          # Cart module
    ├── schemas/
    │   └── cart.schema.ts       # Cart MongoDB schema
    └── dto/
        ├── add-to-cart.dto.ts   # Add to cart validation
        └── update-cart-item.dto.ts # Update cart item validation
└── orders/
    ├── orders.controller.ts     # Orders controller
    ├── orders.service.ts        # Orders service
    ├── orders.module.ts         # Orders module
    ├── schemas/
    │   └── order.schema.ts      # Order MongoDB schema
    └── dto/
        ├── checkout.dto.ts      # Checkout validation
        ├── update-order-status.dto.ts # Update order status validation
        └── query-orders.dto.ts  # Order query validation

## Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Technologies Used

- NestJS - Progressive Node.js framework
- TypeScript - Typed JavaScript
- Jest - Testing framework
