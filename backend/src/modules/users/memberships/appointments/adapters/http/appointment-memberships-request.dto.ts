import { IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBigintId } from '../../../../../../common/http/bigint-id.validator.js';

export class AppointmentIdDto {
  @IsBigintId()
  appointmentId!: string;
}
export class JoinAppointmentDto {
  /** Starting player; false registers as a reserve. */
  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  holder: boolean = true;
}
