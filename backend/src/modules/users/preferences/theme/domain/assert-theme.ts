import { UserError } from '../../../shared/domain/user-error.js';
export function assertTheme(theme: string) {
  if (!['light', 'dark', 'system'].includes(theme))
    throw new UserError('invalid', 'INVALID_THEME', 'Invalid theme');
}
