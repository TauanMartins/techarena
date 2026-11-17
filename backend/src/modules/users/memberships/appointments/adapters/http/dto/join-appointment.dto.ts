import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class JoinAppointmentDto {
  /** Starting player; false registers as a reserve. */
  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  holder: boolean = true;
}
