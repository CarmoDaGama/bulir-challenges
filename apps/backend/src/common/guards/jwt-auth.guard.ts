import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

interface JwtPayload {
  sub: string;
  email: string;
  role: AuthenticatedUser['role'];
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined>; user?: AuthenticatedUser }>();
    const authorizationHeader = request.headers['authorization'];
    const authorization = Array.isArray(authorizationHeader) ? authorizationHeader[0] : authorizationHeader;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authorization.slice(7);

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      request.user = {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}