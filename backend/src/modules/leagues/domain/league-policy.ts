import { DomainError } from '../../../common/domain/domain-error.js';
import type { FixtureScheduleInput, TournamentFormat } from './league.js';

export interface Fixture {
  homeTeamId: string;
  awayTeamId: string;
  phase: 'group' | 'knockout';
  roundNumber: number;
  groupNumber: number | null;
}

export function assertTournamentOptions(
  format: TournamentFormat,
  groupCount: number,
  qualifiersPerGroup: number,
) {
  if (
    groupCount < 2 ||
    groupCount > 16 ||
    qualifiersPerGroup < 1 ||
    qualifiersPerGroup > 8 ||
    (format === 'groups_knockout' &&
      !isPowerOfTwo(groupCount * qualifiersPerGroup))
  )
    throw new DomainError(
      'invalid',
      'INVALID_TOURNAMENT_OPTIONS',
      'Choose 2–16 groups and 1–8 qualifiers per group; group qualifiers must form a power-of-two bracket',
    );
}

function isPowerOfTwo(value: number) {
  return value > 0 && (value & (value - 1)) === 0;
}

function roundRobinFixtures(
  teamIds: string[],
  phase: 'group' | 'knockout',
  groupNumber: number | null = null,
): Fixture[] {
  const teams: (string | null)[] = [...teamIds];
  if (teams.length % 2) teams.push(null);
  const fixtures: Fixture[] = [];
  for (let roundNumber = 1; roundNumber < teams.length; roundNumber += 1) {
    for (let index = 0; index < teams.length / 2; index += 1) {
      const homeTeamId = teams[index];
      const awayTeamId = teams[teams.length - 1 - index];
      if (homeTeamId && awayTeamId) {
        fixtures.push({
          homeTeamId,
          awayTeamId,
          phase,
          roundNumber,
          groupNumber,
        });
      }
    }
    const fixed = teams[0];
    const rotated = teams.slice(1);
    rotated.unshift(rotated.pop()!);
    teams.splice(0, teams.length, fixed, ...rotated);
  }
  return fixtures;
}

export function assertTournamentConfiguration(
  format: TournamentFormat,
  teamCount: number,
  groupCount: number,
  qualifiersPerGroup: number,
) {
  assertTournamentOptions(format, groupCount, qualifiersPerGroup);
  if (format === 'knockout' && !isPowerOfTwo(teamCount))
    throw new DomainError(
      'invalid',
      'KNOCKOUT_TEAM_COUNT',
      'Single elimination requires a power-of-two number of teams',
    );
  if (format === 'groups_knockout') {
    if (
      groupCount < 2 ||
      teamCount % groupCount !== 0 ||
      teamCount / groupCount < 2 ||
      qualifiersPerGroup >= teamCount / groupCount ||
      !isPowerOfTwo(groupCount * qualifiersPerGroup)
    )
      throw new DomainError(
        'invalid',
        'INVALID_GROUP_CONFIGURATION',
        'Teams must divide evenly into groups, with at least two teams per group and a power-of-two qualifier count smaller than each group',
      );
  }
  if (teamCount < 2 || teamCount > 64)
    throw new DomainError(
      'invalid',
      'INVALID_LEAGUE_TEAM_COUNT',
      'A tournament requires between 2 and 64 teams',
    );
}

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

export function buildKnockoutFixtures(
  teamIds: string[],
  roundNumber: number,
): Fixture[] {
  if (!isPowerOfTwo(teamIds.length))
    throw new DomainError(
      'conflict',
      'KNOCKOUT_BRACKET_INVALID',
      'The qualifying teams do not form a complete knockout bracket',
    );
  return Array.from({ length: teamIds.length / 2 }, (_, index) => ({
    homeTeamId: teamIds[index * 2],
    awayTeamId: teamIds[index * 2 + 1],
    phase: 'knockout',
    roundNumber,
    groupNumber: null,
  }));
}

export function assertFixtureSchedule(input: FixtureScheduleInput) {
  if (
    !Number.isInteger(input.daysBetweenMatches) ||
    input.daysBetweenMatches < 1 ||
    input.daysBetweenMatches > 30
  )
    throw new DomainError(
      'invalid',
      'INVALID_MATCH_INTERVAL',
      'Days between matches must be between 1 and 30',
    );
}

export function assertDifferentTeams(homeTeamId: string, awayTeamId: string) {
  if (homeTeamId === awayTeamId)
    throw new DomainError(
      'invalid',
      'LEAGUE_TEAMS_MUST_DIFFER',
      'A match requires two different teams',
    );
}

export function assertValidScores(homeScore: number, awayScore: number) {
  if (
    !Number.isSafeInteger(homeScore) ||
    !Number.isSafeInteger(awayScore) ||
    homeScore < 0 ||
    awayScore < 0
  )
    throw new DomainError(
      'invalid',
      'LEAGUE_SCORE_INVALID',
      'Scores must be non-negative integers',
    );
}
