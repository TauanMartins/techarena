import { DomainError } from '../../../common/domain/domain-error.js';
import { isPowerOfTwo } from './is-power-of-two.js';
import type { TournamentFormat } from './league.js';
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
