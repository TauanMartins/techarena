import { DomainError } from '../../../common/domain/domain-error.js';
import { assertTournamentOptions } from './assert-tournament-options.js';
import { isPowerOfTwo } from './is-power-of-two.js';
import type { TournamentFormat } from './league.js';
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
