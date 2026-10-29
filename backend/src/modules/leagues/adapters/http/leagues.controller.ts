import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiEndpoint } from '../../../../common/http/api-endpoint.decorator.js';
import { ResponseContract } from '../../../../common/http/response-contract.js';
import { CurrentUser } from '../../../auth/adapters/http/auth.decorators.js';
import type { AuthenticatedUser } from '../../../auth/domain/access-token-verifier.port.js';
import { LeaguesApplication } from '../../application/leagues.application.js';
import {
  CreateLeagueDto,
  CreateLeagueMatchDto,
  LeagueArenasDto,
  LeagueAvailabilityDto,
  LeagueAvailabilityQueryDto,
  LeagueDetailsDto,
  LeagueIdDto,
  LeagueListDto,
  LeagueMatchIdDto,
  LeagueMutationResultDto,
  LeagueSummaryDto,
  LeagueTeamParamsDto,
  RecordLeagueResultDto,
  RegisterLeagueTeamDto,
} from './leagues.dto.js';

function serializeSummary<T extends { createdAt: Date }>(league: T) {
  return { ...league, createdAt: league.createdAt.toISOString() };
}

@ApiEndpoint('leagues')
@Controller('leagues')
export class LeaguesController {
  constructor(private readonly application: LeaguesApplication) {}

  @Get()
  @ResponseContract(LeagueListDto)
  async list(@CurrentUser() actor: AuthenticatedUser) {
    return {
      items: (await this.application.list(actor.id)).map(serializeSummary),
    };
  }

  @Post()
  @ResponseContract(LeagueSummaryDto, 201)
  async create(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() input: CreateLeagueDto,
  ) {
    return serializeSummary(await this.application.create(actor.id, input));
  }

  @Get(':leagueId/arenas')
  @ResponseContract(LeagueArenasDto)
  async arenas(
    @CurrentUser() _actor: AuthenticatedUser,
    @Param() params: LeagueIdDto,
  ) {
    return { items: await this.application.arenas(params.leagueId) };
  }

  @Get(':leagueId/availability')
  @ResponseContract(LeagueAvailabilityDto)
  availability(
    @CurrentUser() _actor: AuthenticatedUser,
    @Param() params: LeagueIdDto,
    @Query() query: LeagueAvailabilityQueryDto,
  ) {
    return this.application.availability(params.leagueId, query);
  }

  @Post(':leagueId/teams')
  @ResponseContract(LeagueMutationResultDto, 201)
  async registerTeam(
    @CurrentUser() actor: AuthenticatedUser,
    @Param() params: LeagueIdDto,
    @Body() input: RegisterLeagueTeamDto,
  ) {
    await this.application.registerTeam(
      actor.id,
      params.leagueId,
      input.teamId,
    );
    return { success: true };
  }

  @Delete(':leagueId/teams/:teamId')
  @ResponseContract(LeagueMutationResultDto)
  async removeTeam(
    @CurrentUser() actor: AuthenticatedUser,
    @Param() params: LeagueTeamParamsDto,
  ) {
    await this.application.removeTeam(actor.id, params.leagueId, params.teamId);
    return { success: true };
  }

  @Post(':leagueId/matches')
  @ResponseContract(LeagueMutationResultDto, 201)
  async createMatch(
    @CurrentUser() actor: AuthenticatedUser,
    @Param() params: LeagueIdDto,
    @Body() input: CreateLeagueMatchDto,
  ) {
    await this.application.createMatch(actor.id, params.leagueId, input);
    return { success: true };
  }

  @Put(':leagueId/matches/:matchId/result')
  @ResponseContract(LeagueMutationResultDto)
  async recordResult(
    @CurrentUser() actor: AuthenticatedUser,
    @Param() params: LeagueMatchIdDto,
    @Body() input: RecordLeagueResultDto,
  ) {
    await this.application.recordResult(
      actor.id,
      params.leagueId,
      params.matchId,
      input,
    );
    return { success: true };
  }

  @Get(':leagueId')
  @ResponseContract(LeagueDetailsDto)
  async details(
    @CurrentUser() actor: AuthenticatedUser,
    @Param() params: LeagueIdDto,
  ) {
    const details = await this.application.details(actor.id, params.leagueId);
    return {
      ...details,
      league: serializeSummary(details.league),
      matches: details.matches.map((match) => ({
        ...match,
        scheduledAt: match.scheduledAt.toISOString(),
      })),
    };
  }
}
