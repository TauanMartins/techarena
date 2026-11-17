import { Body, Controller, Post, Put } from '@nestjs/common';
import { ApiEndpoint } from '../../../../../common/http/api-endpoint.decorator.js';
import { ResponseContract } from '../../../../../common/http/response-contract.js';
import { CurrentUser } from '../../../../auth/adapters/http/auth.decorators.js';
import type { AuthenticatedUser } from '../../../../auth/domain/access-token-verifier.port.js';
import { TeamManagementApplication } from '../../../application/teams.application.js';
import { CreateTeamDto, TeamDto, UpdateTeamDto } from '../dto/teams.dto.js';

@ApiEndpoint('teams/management')
@Controller('team')
export class TeamManagementController {
  constructor(private readonly app: TeamManagementApplication) {}
  @Post() @ResponseContract(TeamDto, 201) async create(
    @CurrentUser() a: AuthenticatedUser,
    @Body() b: CreateTeamDto,
  ) {
    const t = await this.app.create(a.id, b);
    return { ...t, createdAt: t.createdAt.toISOString() };
  }
  @Put() @ResponseContract(TeamDto) async update(
    @CurrentUser() a: AuthenticatedUser,
    @Body() b: UpdateTeamDto,
  ) {
    const t = await this.app.update(a.id, b.teamId, b);
    return { ...t, createdAt: t.createdAt.toISOString() };
  }
}
