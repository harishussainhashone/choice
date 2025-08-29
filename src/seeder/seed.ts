import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { AdminSeeder } from './admin.seeder';

async function bootstrap() {
  const app = await NestFactory.create(SeederModule);
  
  const adminSeeder = app.get(AdminSeeder);
  
  console.log('Starting admin seeder...');
  await adminSeeder.seedAdmin();
  console.log('Admin seeder completed!');
  
  await app.close();
}

bootstrap().catch(console.error);
