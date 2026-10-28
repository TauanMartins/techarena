import { Controller, Get, Query } from '@nestjs/common';

import { ResponseContract } from '../../../../../../common/http/response-contract.js';
import { CurrentUser } from '../../../../../auth/adapters/http/auth.decorators.js';
import type { AuthenticatedUser } from '../../../../../auth/domain/access-token-verifier.port.js';
import { TeamMembershipsApplication } from '../../application/team-memberships.application.js';
import { UserEndpoint } from '../../../../shared/http/user-endpoint.decorator.js';
import { PaginationQueryDto } from '../../../../shared/http/pagination.dto.js';
import { TeamPageDto } from './team-memberships-response.dto.js';
@UserEndpoint('users/team-memberships')
@Controller('users')
export class TeamMembershipsController {
  constructor(private readonly application: TeamMembershipsApplication) {}
  @Get('me/teams')
  @ResponseContract(TeamPageDto)
  teams(
    @CurrentUser() identity: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.application.teams(identity.id, query);
  }
}
