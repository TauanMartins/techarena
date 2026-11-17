import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ScheduleDto } from './schedule.dto.js';
export class AvailabilityDto {
  @ApiProperty({ type: [ScheduleDto] })
  @Expose()
  @IsArray()
  @Type(() => ScheduleDto)
  @ValidateNested({ each: true })
  items!: ScheduleDto[];
}
