import { DomainError } from '../../../common/domain/domain-error.js';

export function planArenaSports(
  existing: string[],
  desired: string[],
  validSports: number,
) {
  if (validSports !== desired.length)
    throw new DomainError(
      'not_found',
      'SPORT_NOT_FOUND',
      'One or more sports do not exist',
    );
  return {
    remove: existing.filter((id) => !desired.includes(id)),
    add: desired.filter((id) => !existing.includes(id)),
  };
}
