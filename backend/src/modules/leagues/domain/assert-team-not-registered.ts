import { DomainError } from '../../../common/domain/domain-error.js';
export function assertTeamNotRegistered(registered: boolean) {
  if (registered)
    throw new DomainError(
      'conflict',
      'TEAM_ALREADY_REGISTERED',
      'This team is already registered',
    );
}
