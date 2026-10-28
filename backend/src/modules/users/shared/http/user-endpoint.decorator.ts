import { applyDecorators, UseFilters } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserErrorFilter } from './user-error.filter.js';

export function UserEndpoint(tag: string) {
  return applyDecorators(
    ApiTags(tag),
    ApiBearerAuth(),
    UseFilters(UserErrorFilter),
    ApiUnauthorizedResponse({
      description: 'Missing, invalid or expired access token.',
    }),
    ApiServiceUnavailableResponse({
      description: 'Authentication unavailable.',
    }),
    ApiBadRequestResponse({
      description: 'Invalid input or business rule violation.',
    }),
    ApiNotFoundResponse({
      description: 'Profile or referenced record not found.',
    }),
    ApiConflictResponse({
      description: 'Uniqueness or participation conflict.',
    }),
  );
}
