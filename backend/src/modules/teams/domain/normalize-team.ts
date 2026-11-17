import { DomainError } from '../../../common/domain/domain-error.js';

export function normalizeTeam(input: import('./team.js').TeamInput) {
  const name = input.name.trim();
  if (!name || name.length > 45)
    throw new DomainError(
      'invalid',
      'INVALID_TEAM_NAME',
      'Provide a team name with at most 45 characters',
    );
  return { ...input, name };
}
