import { DomainError } from '../../../common/domain/domain-error.js';
import { assertCaptain } from './assert-captain.js';
export function assertTeamDeletion(captain: boolean, hasCompetitions: boolean) {
  assertCaptain(captain);
  if (hasCompetitions)
    throw new DomainError(
      'conflict',
      'TEAM_HAS_COMPETITIONS',
      'A equipe tem vínculos com ligas ou partidas. Remova as inscrições permitidas antes de excluir; equipes com histórico de partidas devem ser preservadas.',
    );
}
