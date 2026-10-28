import { ValidateBy } from 'class-validator';
import type { ValidationOptions } from 'class-validator';

/** IDs remain strings so JavaScript cannot round PostgreSQL bigint values. */
export function IsBigintId(options?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isBigintId',
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' &&
          /^[1-9]\d{0,18}$/.test(value) &&
          BigInt(value) <= 9223372036854775807n,
        defaultMessage: () =>
          'each ID must be a positive PostgreSQL bigint represented as a string',
      },
    },
    options,
  );
}
