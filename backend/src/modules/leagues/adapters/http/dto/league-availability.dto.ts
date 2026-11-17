import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { LeagueScheduleDto } from './league-schedule.dto.js';
export class LeagueAvailabilityDto {
  @Expose()
  @IsArray()
  @Type(() => LeagueScheduleDto)
  @ValidateNested({ each: true })
  items!: LeagueScheduleDto[];
}
