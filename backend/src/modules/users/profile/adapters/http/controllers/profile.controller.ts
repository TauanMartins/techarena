import { Body, Controller, Get, Patch } from '@nestjs/common';

import { ResponseContract } from '../../../../../../common/http/response-contract.js';
import { CurrentUser } from '../../../../../auth/adapters/http/auth.decorators.js';
import type { AuthenticatedUser } from '../../../../../auth/domain/access-token-verifier.port.js';
import { UserEndpoint } from '../../../../shared/http/user-endpoint.decorator.js';
import { ProfileApplication } from '../../../application/profile.application.js';

import { UpdateProfileDto } from '../dto/profile-request.dto.js';
import { UserProfileDto } from '../dto/profile-response.dto.js';
@UserEndpoint('users/profile')
@Controller('users')
export class ProfileController {
  constructor(private readonly application: ProfileApplication) {}
  @Get('me')
  @ResponseContract(UserProfileDto)
  async profile(@CurrentUser() identity: AuthenticatedUser) {
    const profile = await this.application.profile(identity.id);
    return { ...profile, createdAt: profile.createdAt.toISOString() };
  }

  @Patch('me')
  @ResponseContract(UserProfileDto)
  async update(
    @CurrentUser() identity: AuthenticatedUser,
    @Body() body: UpdateProfileDto,
  ) {
    const profile = await this.application.updateProfile(identity.id, body);
    return { ...profile, createdAt: profile.createdAt.toISOString() };
  }
}
