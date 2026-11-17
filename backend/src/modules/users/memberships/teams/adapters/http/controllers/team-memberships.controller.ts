import { Controller, Get, Query } from '@nestjs/common';

import { ResponseContract } from '../../../../../../../common/http/response-contract.js';
import { CurrentUser } from '../../../../../../auth/adapters/http/auth.decorators.js';
import type { AuthenticatedUser } from '../../../../../../auth/domain/access-token-verifier.port.js';
import { UserEndpoint } from '../../../../../shared/http/user-endpoint.decorator.js';
import { TeamMembershipsApplication } from '../../../application/team-memberships.application.js';
import { TeamMembershipQueryDto } from '../dto/team-memberships-request.dto.js';
import { TeamPageDto } from '../dto/team-memberships-response.dto.js';
@UserEndpoint('users/team-memberships')
@Controller('users')
export class TeamMembershipsController {
  constructor(private readonly application: TeamMembershipsApplication) {}
  @Get('me/teams')
  @ResponseContract(TeamPageDto)
  async teams(
    @CurrentUser() identity: AuthenticatedUser,
    @Query() query: TeamMembershipQueryDto,
  ) {
    const page = await this.application.teams(identity.id, query);
    return {
      ...page,
      items: page.items.map((item) => ({
        ...item,
        joinedAt: item.joinedAt?.toISOString() ?? null,
      })),
    };
  }
}
