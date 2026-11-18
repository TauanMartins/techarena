import { DomainError } from '../../../common/domain/domain-error.js';
import { assertCaptain } from './assert-captain.js';
export function assertTeamDeletion(
  captain: boolean,
  hasActiveCompetitions: boolean,
) {
  assertCaptain(captain);
  if (hasActiveCompetitions)
    throw new DomainError(
      'conflict',
      'TEAM_HAS_COMPETITIONS',
      'A equipe participa de uma liga aberta ou em andamento. Remova a inscrição permitida ou aguarde o encerramento antes de excluir.',
    );
}
