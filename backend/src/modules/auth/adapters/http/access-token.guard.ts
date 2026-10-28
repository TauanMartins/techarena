import {
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ACCESS_TOKEN_VERIFIER,
  IdentityProviderUnavailable,
} from '../../domain/access-token-verifier.port.js';
import type { AccessTokenVerifier } from '../../domain/access-token-verifier.port.js';
import { IS_PUBLIC } from './auth.decorators.js';
import type { AuthenticatedRequest } from './auth.decorators.js';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(ACCESS_TOKEN_VERIFIER)
    private readonly verifier: AccessTokenVerifier,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const match =
      typeof authorization === 'string' &&
      /^Bearer ([^\s,]+)$/i.exec(authorization);
    if (!match || match[1].length > 16384)
      throw new UnauthorizedException('A Bearer access token is required');
    try {
      request.user = await this.verifier.verify(match[1]);
    } catch (error) {
      if (error instanceof IdentityProviderUnavailable)
        throw new ServiceUnavailableException('Authentication is unavailable');
      throw new UnauthorizedException('Invalid or expired access token');
    }
    return true;
  }
}
