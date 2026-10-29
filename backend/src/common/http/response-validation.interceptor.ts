import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  Type,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { mergeMap } from 'rxjs';
import { RESPONSE_CONTRACT } from './response-contract.js';

@Injectable()
export class ResponseValidationInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const dto = this.reflector.get<Type<object>>(
      RESPONSE_CONTRACT,
      context.getHandler(),
    );
    if (!dto) return next.handle();
    return next.handle().pipe(
      mergeMap(async (value: unknown) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
          throw new InternalServerErrorException(
            'O servidor não conseguiu processar a resposta da solicitação.',
          );
        }
        const response = plainToInstance(dto, value, {
          excludeExtraneousValues: true,
        });
        const errors = await validate(response, { forbidUnknownValues: true });
        if (errors.length)
          throw new InternalServerErrorException(
            'O servidor não conseguiu processar a resposta da solicitação.',
          );
        return instanceToPlain(response);
      }),
    );
  }
}
