import { InternalServerErrorException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of } from 'rxjs';
import { HealthResponseDto } from '../../health/health-response.dto.js';
import { ResponseValidationInterceptor } from './response-validation.interceptor.js';

const context = {
  getHandler: () => () => undefined,
} as unknown as ExecutionContext;
const reflector = { get: () => HealthResponseDto } as unknown as Reflector;

it('projects only declared response properties', async () => {
  const interceptor = new ResponseValidationInterceptor(reflector);
  await expect(
    lastValueFrom(
      interceptor.intercept(context, {
        handle: () => of({ status: 'ok', database: 'up', secret: 'hidden' }),
      }),
    ),
  ).resolves.toEqual({ status: 'ok', database: 'up' });
});
it('rejects invalid response contracts', async () => {
  const interceptor = new ResponseValidationInterceptor(reflector);
  await expect(
    lastValueFrom(
      interceptor.intercept(context, { handle: () => of({ status: 'wrong' }) }),
    ),
  ).rejects.toBeInstanceOf(InternalServerErrorException);
});
