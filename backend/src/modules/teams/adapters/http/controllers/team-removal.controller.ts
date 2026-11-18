import { Controller, Delete, Param } from '@nestjs/common';
import { ApiEndpoint } from '../../../../../common/http/api-endpoint.decorator.js';
import { ActionResultDto } from '../../../../../common/http/dto/action-result.dto.js';
import { ResponseContract } from '../../../../../common/http/response-contract.js';
import { CurrentUser } from '../../../../auth/adapters/http/auth.decorators.js';
import type { AuthenticatedUser } from '../../../../auth/domain/access-token-verifier.port.js';
import { TeamManagementApplication } from '../../../application/team-management-application.js';
import { TeamIdDto } from '../dto/team-id.dto.js';
import { TeamMemberParamsDto } from '../dto/team-member-params.dto.js';
@ApiEndpoint('teams/management')
@Controller('team')
export class TeamRemovalController {
  constructor(private readonly app: TeamManagementApplication) {}
  @Delete(':teamId/members/me')
  @ResponseContract(ActionResultDto)
  leave(@CurrentUser() actor: AuthenticatedUser, @Param() params: TeamIdDto) {
    return this.app.removeMember(actor.id, params.teamId, actor.id);
  }
  @Delete(':teamId/members/:userId')
  @ResponseContract(ActionResultDto)
  removeMember(
    @CurrentUser() actor: AuthenticatedUser,
    @Param() params: TeamMemberParamsDto,
  ) {
    return this.app.removeMember(actor.id, params.teamId, params.userId);
  }
  @Delete(':teamId')
  @ResponseContract(ActionResultDto)
  remove(@CurrentUser() actor: AuthenticatedUser, @Param() params: TeamIdDto) {
    return this.app.remove(actor.id, params.teamId);
  }
}
