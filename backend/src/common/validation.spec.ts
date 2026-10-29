import { BadRequestException } from '@nestjs/common';
import { IsEmail } from 'class-validator';
import { createValidationPipe } from './validation.js';

class ExampleRequestDto {
  @IsEmail()
  email!: string;
}

const metadata = { type: 'body' as const, metatype: ExampleRequestDto };

describe('API input validation', () => {
  it('rejects invalid input and undeclared properties', async () => {
    const pipe = createValidationPipe();
    const invalidEmail = pipe.transform({ email: 'invalid' }, metadata);
    await expect(invalidEmail).rejects.toBeInstanceOf(BadRequestException);
    await expect(invalidEmail).rejects.toMatchObject({
      response: {
        message:
          'Os dados enviados são inválidos. Verifique os campos e tente novamente.',
      },
    });
    await expect(
      pipe.transform({ email: 'user@example.test', role: 'admin' }, metadata),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('transforms a valid request into its DTO class', async () => {
    const result = await createValidationPipe().transform(
      { email: 'user@example.test' },
      metadata,
    );
    expect(result).toBeInstanceOf(ExampleRequestDto);
  });
});
