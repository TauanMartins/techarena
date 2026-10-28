import { applyDecorators, UseFilters } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiServiceUnavailableResponse,
} from '@nestjs/swagger';
import { DomainErrorFilter } from './domain-error.filter.js';
export function ApiEndpoint(tag: string) {
  return applyDecorators(
    ApiTags(tag),
    ApiBearerAuth(),
    UseFilters(DomainErrorFilter),
    ApiBadRequestResponse({ description: 'Invalid input or business rule.' }),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid Bearer token.',
    }),
    ApiForbiddenResponse({
      description: 'The authenticated user cannot perform this action.',
    }),
    ApiNotFoundResponse({ description: 'Referenced record not found.' }),
    ApiConflictResponse({ description: 'State or uniqueness conflict.' }),
    ApiServiceUnavailableResponse({
      description: 'Authentication unavailable.',
    }),
  );
}
