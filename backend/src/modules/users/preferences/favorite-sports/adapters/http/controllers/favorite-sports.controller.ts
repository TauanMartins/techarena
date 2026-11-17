import { Body, Controller, Get, Put } from '@nestjs/common';

import { ResponseContract } from '../../../../../../../common/http/response-contract.js';
import { CurrentUser } from '../../../../../../auth/adapters/http/auth.decorators.js';
import type { AuthenticatedUser } from '../../../../../../auth/domain/access-token-verifier.port.js';
import { UserEndpoint } from '../../../../../shared/http/user-endpoint.decorator.js';
import { FavoriteSportsApplication } from '../../../application/favorite-sports.application.js';

import { ReplaceSportsDto } from '../dto/favorite-sports-request.dto.js';
import { FavoriteSportsDto } from '../dto/favorite-sports-response.dto.js';
@UserEndpoint('users/favorite-sports')
@Controller('users')
export class FavoriteSportsController {
  constructor(private readonly application: FavoriteSportsApplication) {}
  @Get('me/sports')
  @ResponseContract(FavoriteSportsDto)
  sports(@CurrentUser() identity: AuthenticatedUser) {
    return this.application.sports(identity.id);
  }

  @Put('me/sports')
  @ResponseContract(FavoriteSportsDto)
  replaceSports(
    @CurrentUser() identity: AuthenticatedUser,
    @Body() body: ReplaceSportsDto,
  ) {
    return this.application.replaceSports(identity.id, body.sportIds);
  }
}
