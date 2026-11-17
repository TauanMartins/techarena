import { Controller, Get, Query } from '@nestjs/common';
import { ApiEndpoint } from '../../../../../common/http/api-endpoint.decorator.js';
import { ResponseContract } from '../../../../../common/http/response-contract.js';
import { TeamCatalogApplication } from '../../../application/teams.application.js';
import {
  TeamCatalogPageDto,
  TeamExistsDto,
  TeamNameQueryDto,
  TeamQueryDto,
} from '../dto/teams.dto.js';

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
