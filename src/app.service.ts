import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  getInfo(): { name: string; version: string; description: string } {
    return {
      name: 'NestJS API',
      version: '1.0.0',
      description: 'A simple NestJS API with user management and MongoDB',
    };
  }
}
