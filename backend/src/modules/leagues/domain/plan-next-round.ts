import { DomainError } from '../../../common/domain/domain-error.js';
import { buildKnockoutFixtures } from './build-knockout-fixtures.js';
import type { Fixture } from './league-policy-types.js';
export interface RoundMatch {
  id: string;
  phase: 'group' | 'knockout' | 'manual';
  roundNumber: number;
  winnerTeamId: string | null;
}
export function planNextRound(
  league: { format: string; groupCount: number; qualifiersPerGroup: number },
  matchRows: RoundMatch[],
  standings: { teamId: string; groupNumber: number }[],
  unresolvedKnockout: number,
  unresolvedGroups: number,
) {
  if (
    matchRows.some((match) => !match.winnerTeamId && match.phase === 'knockout')
  ) {
    if (unresolvedKnockout)
      throw new DomainError(
        'conflict',
        'LEAGUE_ROUND_INCOMPLETE',
        'Every match in the current knockout round needs a winner before advancing',
      );
  }

  let fixtures: Fixture[];
  let nextRound: number;
  const knockoutMatches = matchRows.filter(
    (match) => match.phase === 'knockout',
  );
  if (league.format === 'groups_knockout' && knockoutMatches.length === 0) {
    const groupMatches = matchRows.filter((match) => match.phase === 'group');
    if (
      !groupMatches.length ||
      groupMatches.some((match) => !match.id || !match.winnerTeamId)
    ) {
      if (unresolvedGroups > 0)
        throw new DomainError(
          'conflict',
          'LEAGUE_GROUPS_INCOMPLETE',
          'All group matches must have a result before qualification',
        );
    }

    const selected: string[] = [];
    for (let group = 1; group <= Number(league.groupCount); group += 1) {
      const groupTeams = standings.filter(
        (standing) => Number(standing.groupNumber) === group,
      );
      selected.push(
        ...groupTeams
          .slice(0, Number(league.qualifiersPerGroup))
          .map((standing) => standing.teamId),
      );
    }
    if (!selected.length)
      throw new DomainError(
        'conflict',
        'LEAGUE_GROUPS_MISSING',
        'No group standings are available',
      );
    fixtures = buildKnockoutFixtures(selected, 1);
    nextRound = 1;
  } else {
    if (!knockoutMatches.length)
      throw new DomainError(
        'conflict',
        'LEAGUE_KNOCKOUT_NOT_STARTED',
        'Generate the initial fixtures before advancing',
      );
    const currentRound = Math.max(
      ...knockoutMatches.map((match) => Number(match.roundNumber)),
    );
    const currentMatches = knockoutMatches.filter(
      (match) => Number(match.roundNumber) === currentRound,
    );
    if (currentMatches.some((match) => !match.winnerTeamId))
      throw new DomainError(
        'conflict',
        'LEAGUE_ROUND_INCOMPLETE',
        'Every match in the current knockout round needs a winner before advancing',
      );
    if (currentMatches.length === 1)
      throw new DomainError(
        'conflict',
        'LEAGUE_TOURNAMENT_FINISHED',
        'The final has already been completed',
      );
    fixtures = buildKnockoutFixtures(
      currentMatches.map((match) => match.winnerTeamId!),
      currentRound + 1,
    );
    nextRound = currentRound + 1;
  }

  return fixtures.map((fixture) => ({ ...fixture, roundNumber: nextRound }));
}
