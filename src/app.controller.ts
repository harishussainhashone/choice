import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('info')
  getInfo(): { name: string; version: string; description: string } {
    return {
      name: 'NestJS API',
      version: '1.0.0',
      description: 'A simple NestJS API with user management and MongoDB',
    };
  }
}
