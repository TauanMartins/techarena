import { DomainError } from '../../../common/domain/domain-error.js';
import { isPowerOfTwo } from './is-power-of-two.js';
import { Fixture } from './league-policy-types.js';
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
