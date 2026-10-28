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
    await expect(
      pipe.transform({ email: 'invalid' }, metadata),
    ).rejects.toBeInstanceOf(BadRequestException);
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
