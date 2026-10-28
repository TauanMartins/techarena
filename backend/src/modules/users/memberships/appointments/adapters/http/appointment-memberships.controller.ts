import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ResponseContract } from '../../../../../../common/http/response-contract.js';
import { CurrentUser } from '../../../../../auth/adapters/http/auth.decorators.js';
import type { AuthenticatedUser } from '../../../../../auth/domain/access-token-verifier.port.js';
import { AppointmentMembershipsApplication } from '../../application/appointment-memberships.application.js';
import { UserEndpoint } from '../../../../shared/http/user-endpoint.decorator.js';
import { PaginationQueryDto } from '../../../../shared/http/pagination.dto.js';
import {
  AppointmentIdDto,
  JoinAppointmentDto,
} from './appointment-memberships-request.dto.js';
import {
  AppointmentResponseDto,
  AppointmentPageDto,
} from './appointment-memberships-response.dto.js';
@UserEndpoint('users/appointment-memberships')
@Controller('users')
export class AppointmentMembershipsController {
  constructor(
    private readonly application: AppointmentMembershipsApplication,
  ) {}
  @Get('me/appointments')
  @ResponseContract(AppointmentPageDto)
  async appointments(
    @CurrentUser() identity: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    const page = await this.application.appointments(identity.id, query);
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
    const result = await this.application.joinAppointment(
      identity.id,
      params.appointmentId,
      body.holder,
    );
    return { ...result, scheduledAt: result.scheduledAt.toISOString() };
  }
}
