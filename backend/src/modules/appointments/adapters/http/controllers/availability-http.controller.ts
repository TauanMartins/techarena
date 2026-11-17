import { Controller, Get, Query } from '@nestjs/common';
import { ApiEndpoint } from '../../../../../common/http/api-endpoint.decorator.js';
import { ResponseContract } from '../../../../../common/http/response-contract.js';
import { AvailabilityApplication } from '../../../application/appointments.application.js';
import {
  AvailabilityDto,
  AvailabilityQueryDto,
} from '../dto/appointments.dto.js';

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
