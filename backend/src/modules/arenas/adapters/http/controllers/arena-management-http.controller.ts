import { Body, Controller, Post, Put } from '@nestjs/common';
import { ApiEndpoint } from '../../../../../common/http/api-endpoint.decorator.js';
import { ResponseContract } from '../../../../../common/http/response-contract.js';
import { CurrentUser } from '../../../../auth/adapters/http/auth.decorators.js';
import type { AuthenticatedUser } from '../../../../auth/domain/access-token-verifier.port.js';
import { ArenaManagementApplication } from '../../../application/arenas.application.js';
import { ArenaDto, CreateArenaDto, UpdateArenaDto } from '../dto/arenas.dto.js';

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
