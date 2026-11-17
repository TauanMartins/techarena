import { DomainError } from '../../../common/domain/domain-error.js';

export function assertCaptain(isCaptain: boolean) {
  if (!isCaptain)
    throw new DomainError(
      'forbidden',
      'CAPTAIN_REQUIRED',
      'Only a team captain can perform this action',
    );
}
