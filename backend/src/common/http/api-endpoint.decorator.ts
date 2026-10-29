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
    ApiBadRequestResponse({
      description: 'Dados inválidos ou regra de negócio não atendida.',
    }),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid Bearer token.',
    }),
    ApiForbiddenResponse({
      description: 'O usuário autenticado não pode realizar esta ação.',
    }),
    ApiNotFoundResponse({
      description: 'Registro relacionado não encontrado.',
    }),
    ApiConflictResponse({
      description: 'Conflito de estado ou de unicidade.',
    }),
    ApiServiceUnavailableResponse({
      description: 'Serviço de autenticação indisponível.',
    }),
  );
}
