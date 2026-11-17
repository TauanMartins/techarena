import { DomainError } from '../../../common/domain/domain-error.js';

export function assertDifferentTeams(homeTeamId: string, awayTeamId: string) {
  if (homeTeamId === awayTeamId)
    throw new DomainError(
      'invalid',
      'LEAGUE_TEAMS_MUST_DIFFER',
      'A match requires two different teams',
    );
}
