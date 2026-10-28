import {
  createParamDecorator,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../domain/access-token-verifier.port.js';

export const IS_PUBLIC = Symbol('IS_PUBLIC');
export const Public = () => SetMetadata(IS_PUBLIC, true);
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (!user) throw new UnauthorizedException();
    return user;
  },
);
