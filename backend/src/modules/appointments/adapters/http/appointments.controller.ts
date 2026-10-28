import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiEndpoint } from '../../../../common/http/api-endpoint.decorator.js';
import { ResponseContract } from '../../../../common/http/response-contract.js';
import { CurrentUser } from '../../../auth/adapters/http/auth.decorators.js';
import type { AuthenticatedUser } from '../../../auth/domain/access-token-verifier.port.js';
import {
  AppointmentsApplication,
  AvailabilityApplication,
} from '../../application/appointments.application.js';
import {
  AppointmentsQueryDto,
  AvailabilityDto,
  AvailabilityQueryDto,
  BookingDto,
  BookingPageDto,
  CreateAppointmentDto,
} from './appointments.dto.js';
@ApiEndpoint('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly application: AppointmentsApplication) {}
  @Get() @ResponseContract(BookingPageDto) async list(
    @CurrentUser() a: AuthenticatedUser,
    @Query() q: AppointmentsQueryDto,
  ) {
    const page = await this.application.list(a.id, q);
    return {
      ...page,
      items: page.items.map((item) => ({
        ...item,
        scheduledAt: item.scheduledAt.toISOString(),
      })),
    };
  }
  @Get('user') @ResponseContract(BookingPageDto) async mine(
    @CurrentUser() a: AuthenticatedUser,
    @Query() q: AppointmentsQueryDto,
  ) {
    const page = await this.application.list(a.id, q, true);
    return {
      ...page,
      items: page.items.map((item) => ({
        ...item,
        scheduledAt: item.scheduledAt.toISOString(),
      })),
    };
  }
  @Post() @ResponseContract(BookingDto, 201) async create(
    @CurrentUser() a: AuthenticatedUser,
    @Body() body: CreateAppointmentDto,
  ) {
    const item = await this.application.create(a.id, body);
    return { ...item, scheduledAt: item.scheduledAt.toISOString() };
  }
}
@ApiEndpoint('appointments/availability')
@Controller('horary')
export class AvailabilityController {
  constructor(private readonly application: AvailabilityApplication) {}
  @Get() @ResponseContract(AvailabilityDto) available(
    @Query() query: AvailabilityQueryDto,
  ) {
    return this.application.available(query);
  }
}
