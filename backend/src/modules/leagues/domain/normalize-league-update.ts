import { DomainError } from '../../../common/domain/domain-error.js';
import type { LeagueUpdateInput } from './league.js';
export function normalizeLeagueUpdate(
  input: LeagueUpdateInput,
): LeagueUpdateInput {
  if (input.name !== undefined && !input.name.trim())
    throw new DomainError(
      'invalid',
      'INVALID_LEAGUE_NAME',
      'League name cannot be empty',
    );
  return {
    ...input,
    name: input.name?.trim(),
    description:
      input.description === undefined
        ? undefined
        : input.description?.trim() || null,
  };
}
