import { DomainError } from '../../../common/domain/domain-error.js';
export function assertFixturesNotGenerated(count: number) {
  if (count)
    throw new DomainError(
      'conflict',
      'LEAGUE_FIXTURES_EXIST',
      'Fixtures have already been generated',
    );
}
