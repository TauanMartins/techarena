import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiEndpoint } from '../../../../common/http/api-endpoint.decorator.js';
import { ResponseContract } from '../../../../common/http/response-contract.js';
import { PaginationQueryDto } from '../../../../common/http/pagination.dto.js';
import { CurrentUser } from '../../../auth/adapters/http/auth.decorators.js';
import type { AuthenticatedUser } from '../../../auth/domain/access-token-verifier.port.js';
import {
  TeamCatalogApplication,
  TeamManagementApplication,
  TeamRequestsApplication,
} from '../../application/teams.application.js';
import {
  CreateTeamDto,
  DecideMemberDto,
  DecisionDto,
  InviteMemberDto,
  JoinTeamDto,
  MembershipRequestDto,
  MembershipRequestPageDto,
  RequestIdDto,
  TeamDto,
  TeamExistsDto,
  TeamNameQueryDto,
  TeamCatalogPageDto,
  TeamMemberPageDto,
  TeamQueryDto,
  TeamRequestQueryDto,
  UpdateTeamDto,
} from './teams.dto.js';
@ApiEndpoint('teams/catalog')
@Controller('team')
export class TeamCatalogController {
  constructor(private readonly app: TeamCatalogApplication) {}
  @Get() @ResponseContract(TeamCatalogPageDto) async list(
    @Query() q: TeamQueryDto,
  ) {
    const p = await this.app.list(q);
    return {
      ...p,
      items: p.items.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }
  @Get('exist') @ResponseContract(TeamExistsDto) exists(
    @Query() q: TeamNameQueryDto,
  ) {
    return this.app.exists(q.name);
  }
}
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
@ApiEndpoint('teams/requests')
@Controller()
export class TeamRequestsController {
  constructor(private readonly app: TeamRequestsApplication) {}
  @Get('team/members')
  @ResponseContract(TeamMemberPageDto)
  async members(
    @CurrentUser() _actor: AuthenticatedUser,
    @Query() q: TeamRequestQueryDto,
  ) {
    const page = await this.app.members(q.teamId, q);
    return {
      ...page,
      items: page.items.map((member) => ({
        ...member,
        joinedAt: member.joinedAt?.toISOString() ?? null,
      })),
    };
  }
  @Post('team/user') @ResponseContract(MembershipRequestDto, 201) async invite(
    @CurrentUser() a: AuthenticatedUser,
    @Body() b: InviteMemberDto,
  ) {
    const r = await this.app.invite(a.id, b.teamId, b.userId);
    return { ...r, createdAt: r.createdAt.toISOString() };
  }
  @Put('team/user') @ResponseContract(MembershipRequestDto) async decide(
    @CurrentUser() a: AuthenticatedUser,
    @Body() b: DecideMemberDto,
  ) {
    const r = await this.app.decide(a.id, b.teamId, b.userId, b.action);
    return { ...r, createdAt: r.createdAt.toISOString() };
  }
  @Get('team/user')
  @ResponseContract(MembershipRequestPageDto)
  async teamRequests(
    @CurrentUser() a: AuthenticatedUser,
    @Query() q: TeamRequestQueryDto,
  ) {
    const p = await this.app.list(a.id, q, q.teamId);
    return {
      ...p,
      items: p.items.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }
  @Post('users/me/team-requests')
  @ResponseContract(MembershipRequestDto, 201)
  async request(@CurrentUser() a: AuthenticatedUser, @Body() b: JoinTeamDto) {
    const r = await this.app.request(a.id, b.teamId);
    return { ...r, createdAt: r.createdAt.toISOString() };
  }
  @Get('users/me/team-requests')
  @ResponseContract(MembershipRequestPageDto)
  async mine(
    @CurrentUser() a: AuthenticatedUser,
    @Query() q: PaginationQueryDto,
  ) {
    const p = await this.app.list(a.id, q);
    return {
      ...p,
      items: p.items.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }
  @Put('users/me/team-invitations/:requestId')
  @ResponseContract(MembershipRequestDto)
  async respond(
    @CurrentUser() a: AuthenticatedUser,
    @Param() p: RequestIdDto,
    @Body() b: DecisionDto,
  ) {
    const r = await this.app.respond(a.id, p.requestId, b.action);
    return { ...r, createdAt: r.createdAt.toISOString() };
  }
}
