import { QueryFailedError } from 'typeorm';
import { DomainError } from '../domain/domain-error.js';
export async function databaseWrite<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof QueryFailedError) {
      const code = (error.driverError as { code?: string }).code;
      if (code === '23505')
        throw new DomainError(
          'conflict',
          'RESOURCE_CONFLICT',
          'A conflicting record already exists',
        );
      if (code === '23503')
        throw new DomainError(
          'conflict',
          'REFERENCE_IN_USE',
          'A referenced record is missing or in use',
        );
    }
    throw error;
  }
}
