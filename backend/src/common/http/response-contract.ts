import { applyDecorators, SetMetadata } from '@nestjs/common';
import type { Type } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export const RESPONSE_CONTRACT = Symbol('RESPONSE_CONTRACT');

/** Use the same DTO for runtime projection/validation and OpenAPI. */
export function ResponseContract(
  dto: Type<object>,
  status = 200,
  description = 'Successful response',
) {
  return applyDecorators(
    SetMetadata(RESPONSE_CONTRACT, dto),
    ApiResponse({ status, type: dto, description }),
  );
}
