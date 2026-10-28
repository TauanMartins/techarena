import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { ApiEndpoint } from '../../../../common/http/api-endpoint.decorator.js';
import { ResponseContract } from '../../../../common/http/response-contract.js';
import { CurrentUser } from '../../../auth/adapters/http/auth.decorators.js';
import type { AuthenticatedUser } from '../../../auth/domain/access-token-verifier.port.js';
import {
  ArenaCatalogApplication,
  ArenaManagementApplication,
} from '../../application/arenas.application.js';
import {
  ArenaDto,
  ArenaPageDto,
  ArenaQueryDto,
  ArenaSportQueryDto,
  CreateArenaDto,
  UpdateArenaDto,
} from './arenas.dto.js';
@ApiEndpoint('arenas/catalog')
@Controller('arenas')
export class ArenaCatalogController {
  constructor(private readonly application: ArenaCatalogApplication) {}
  @Get() @ResponseContract(ArenaPageDto) list(
    @CurrentUser() a: AuthenticatedUser,
    @Query() q: ArenaQueryDto,
  ) {
    return this.application.list(a.id, q);
  }
  @Get('sports') @ResponseContract(ArenaPageDto) bySport(
    @CurrentUser() a: AuthenticatedUser,
    @Query() q: ArenaSportQueryDto,
  ) {
    return this.application.list(a.id, q);
  }
  @Get('users') @ResponseContract(ArenaPageDto) nearby(
    @CurrentUser() a: AuthenticatedUser,
    @Query() q: ArenaQueryDto,
  ) {
    return this.application.list(a.id, q);
  }
  @Get('admin') @ResponseContract(ArenaPageDto) admin(
    @CurrentUser() a: AuthenticatedUser,
    @Query() q: ArenaQueryDto,
  ) {
    return this.application.list(a.id, q, true);
  }
}
@ApiEndpoint('arenas/management')
@Controller('arenas')
export class ArenaManagementController {
  constructor(private readonly application: ArenaManagementApplication) {}
  @Post() @ResponseContract(ArenaDto, 201) create(
    @CurrentUser() a: AuthenticatedUser,
    @Body() body: CreateArenaDto,
  ) {
    return this.application.create(a.id, body);
  }
  @Put() @ResponseContract(ArenaDto) update(
    @CurrentUser() a: AuthenticatedUser,
    @Body() body: UpdateArenaDto,
  ) {
    return this.application.update(a.id, body.arenaId, body);
  }
}
