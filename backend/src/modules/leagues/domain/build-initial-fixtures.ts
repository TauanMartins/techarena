import { assertTournamentConfiguration } from './assert-tournament-configuration.js';
import { Fixture } from './league-policy-types.js';
import type { TournamentFormat } from './league.js';
import { roundRobinFixtures } from './round-robin-fixtures.js';
export function buildInitialFixtures(
  teamIds: string[],
  format: TournamentFormat,
  groupCount: number,
  qualifiersPerGroup: number,
): Fixture[] {
  assertTournamentConfiguration(
    format,
    teamIds.length,
    groupCount,
    qualifiersPerGroup,
  );
  if (format === 'round_robin') return roundRobinFixtures(teamIds, 'group');
  if (format === 'knockout') {
    return Array.from({ length: teamIds.length / 2 }, (_, index) => ({
      homeTeamId: teamIds[index * 2],
      awayTeamId: teamIds[index * 2 + 1],
      phase: 'knockout' as const,
      roundNumber: 1,
      groupNumber: null,
    }));
  }
  const groups = Array.from({ length: groupCount }, () => [] as string[]);
  teamIds.forEach((teamId, index) => groups[index % groupCount].push(teamId));
  return groups.flatMap((group, index) =>
    roundRobinFixtures(group, 'group', index + 1),
  );
}
