import { DomainError } from '../../../common/domain/domain-error.js';
export function assertRegisteredOpponents(count: number) {
  if (count !== 2)
    throw new DomainError(
      'invalid',
      'LEAGUE_TEAMS_NOT_REGISTERED',
      'Both teams must be registered in this league',
    );
}
