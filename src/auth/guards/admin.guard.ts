import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new ForbiddenException('Access token is required');
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      const payload = this.jwtService.verify(token);
      
      if (payload.role !== 'admin') {
        throw new ForbiddenException('Admin access required');
      }
      
      // Add user info to request for use in controllers
      request.user = payload;
      return true;
    } catch (error) {
      throw new ForbiddenException('Invalid or expired token');
    }
  }
}
