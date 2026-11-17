import { Controller, Get, Query } from '@nestjs/common';
import { ApiEndpoint } from '../../../../../common/http/api-endpoint.decorator.js';
import { ResponseContract } from '../../../../../common/http/response-contract.js';
import { CurrentUser } from '../../../../auth/adapters/http/auth.decorators.js';
import type { AuthenticatedUser } from '../../../../auth/domain/access-token-verifier.port.js';
import { ArenaCatalogApplication } from '../../../application/arenas.application.js';
import {
  ArenaPageDto,
  ArenaQueryDto,
  ArenaSportQueryDto,
} from '../dto/arenas.dto.js';

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
