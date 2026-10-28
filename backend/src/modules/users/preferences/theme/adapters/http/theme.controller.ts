import { Body, Controller, Get, Put } from '@nestjs/common';

import { ResponseContract } from '../../../../../../common/http/response-contract.js';
import { CurrentUser } from '../../../../../auth/adapters/http/auth.decorators.js';
import type { AuthenticatedUser } from '../../../../../auth/domain/access-token-verifier.port.js';
import { ThemeApplication } from '../../application/theme.application.js';
import { UserEndpoint } from '../../../../shared/http/user-endpoint.decorator.js';

import { UpdateThemeDto } from './theme-request.dto.js';
import { ThemeResponseDto } from './theme-response.dto.js';
@UserEndpoint('users/theme')
@Controller('users')
export class ThemeController {
  constructor(private readonly application: ThemeApplication) {}
  @Get('me/theme')
  @ResponseContract(ThemeResponseDto)
  theme(@CurrentUser() identity: AuthenticatedUser) {
    return this.application.theme(identity.id);
  }

  @Put('me/theme')
  @ResponseContract(ThemeResponseDto)
  setTheme(
    @CurrentUser() identity: AuthenticatedUser,
    @Body() body: UpdateThemeDto,
  ) {
    return this.application.setTheme(identity.id, body.theme);
  }
}
