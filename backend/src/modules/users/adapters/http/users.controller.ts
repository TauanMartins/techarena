import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseFilters,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ResponseContract } from '../../../../common/http/response-contract.js';
import { CurrentUser } from '../../../auth/adapters/http/auth.decorators.js';
import type { AuthenticatedUser } from '../../../auth/domain/access-token-verifier.port.js';
import { UserApplication } from '../../application/user.application.js';
import { UserErrorFilter } from './user-error.filter.js';
import {
  AppointmentIdDto,
  JoinAppointmentDto,
  PaginationQueryDto,
  ReplaceSportsDto,
  SearchUsersQueryDto,
  UpdateProfileDto,
  UpdateThemeDto,
} from './dto/user-request.dto.js';
import {
  AppointmentPageDto,
  AppointmentResponseDto,
  FavoriteSportsDto,
  TeamPageDto,
  ThemeResponseDto,
  UserPageDto,
  UserProfileDto,
} from './dto/user-response.dto.js';

@ApiTags('users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing, invalid or expired access token.',
})
@ApiServiceUnavailableResponse({
  description: 'Identity provider unavailable or not configured.',
})
@ApiBadRequestResponse({
  description: 'Invalid input or business rule violation.',
})
@ApiNotFoundResponse({ description: 'Profile or referenced record not found.' })
@ApiConflictResponse({
  description: 'Profile uniqueness conflict or participation conflict.',
})
@UseFilters(UserErrorFilter)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UserApplication) {}

  @Get()
  @ApiOperation({
    summary: 'Search user cards without exposing private profile fields',
  })
  @ResponseContract(UserPageDto)
  search(@Query() query: SearchUsersQueryDto) {
    return this.users.search(query.search, query);
  }

  @Get('me')
  @ResponseContract(UserProfileDto)
  async profile(@CurrentUser() identity: AuthenticatedUser) {
    const profile = await this.users.profile(identity.id);
    return { ...profile, createdAt: profile.createdAt.toISOString() };
  }

  @Patch('me')
  @ResponseContract(UserProfileDto)
  async update(
    @CurrentUser() identity: AuthenticatedUser,
    @Body() body: UpdateProfileDto,
  ) {
    const profile = await this.users.updateProfile(identity.id, body);
    return { ...profile, createdAt: profile.createdAt.toISOString() };
  }

  @Get('me/theme')
  @ResponseContract(ThemeResponseDto)
  theme(@CurrentUser() identity: AuthenticatedUser) {
    return this.users.theme(identity.id);
  }

  @Put('me/theme')
  @ResponseContract(ThemeResponseDto)
  setTheme(
    @CurrentUser() identity: AuthenticatedUser,
    @Body() body: UpdateThemeDto,
  ) {
    return this.users.setTheme(identity.id, body.theme);
  }

  @Get('me/sports')
  @ResponseContract(FavoriteSportsDto)
  sports(@CurrentUser() identity: AuthenticatedUser) {
    return this.users.sports(identity.id);
  }

  @Put('me/sports')
  @ResponseContract(FavoriteSportsDto)
  replaceSports(
    @CurrentUser() identity: AuthenticatedUser,
    @Body() body: ReplaceSportsDto,
  ) {
    return this.users.replaceSports(identity.id, body.sportIds);
  }

  @Get('me/teams')
  @ResponseContract(TeamPageDto)
  teams(
    @CurrentUser() identity: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.users.teams(identity.id, query);
  }

  @Get('me/appointments')
  @ResponseContract(AppointmentPageDto)
  async appointments(
    @CurrentUser() identity: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    const page = await this.users.appointments(identity.id, query);
    return {
      ...page,
      items: page.items.map((item) => ({
        ...item,
        scheduledAt: item.scheduledAt.toISOString(),
      })),
    };
  }

  @Post('me/appointments/:appointmentId')
  @ApiOperation({
    summary: 'Join a future scheduled appointment as the authenticated user',
  })
  @ResponseContract(AppointmentResponseDto, 201)
  async join(
    @CurrentUser() identity: AuthenticatedUser,
    @Param() params: AppointmentIdDto,
    @Body() body: JoinAppointmentDto,
  ) {
    const result = await this.users.joinAppointment(
      identity.id,
      params.appointmentId,
      body.holder,
    );
    return { ...result, scheduledAt: result.scheduledAt.toISOString() };
  }
}
