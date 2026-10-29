import { BadRequestException, ValidationPipe } from '@nestjs/common';

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    exceptionFactory: () =>
      new BadRequestException(
        'Os dados enviados são inválidos. Verifique os campos e tente novamente.',
      ),
  });
}
