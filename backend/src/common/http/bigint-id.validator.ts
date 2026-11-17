import type { ValidationOptions } from 'class-validator';
import { ValidateBy } from 'class-validator';
import { isInt64Identifier } from '../domain/int64-identifier.js';

export function IsBigintId(options?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isBigintId',
      validator: {
        validate: isInt64Identifier,
        defaultMessage: () =>
          'each ID must be a positive PostgreSQL bigint represented as a string',
      },
    },
    options,
  );
}
