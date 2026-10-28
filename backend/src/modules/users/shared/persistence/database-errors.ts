import { QueryFailedError } from 'typeorm';
import { UserError } from '../domain/user-error.js';
export async function userDatabaseWrite<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof QueryFailedError) {
      const code = (error.driverError as { code?: string }).code;
      if (code === '23505')
        throw new UserError(
          'conflict',
          'PROFILE_CONFLICT',
          'The username or email is already in use',
        );
      if (code === '23503')
        throw new UserError(
          'not_found',
          'REFERENCE_NOT_FOUND',
          'The referenced record no longer exists',
        );
    }
    throw error;
  }
}
