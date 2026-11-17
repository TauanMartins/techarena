import { Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

export class FixtureScheduleDto {
  @IsBigintId() arenaId!: string;
  @IsBigintId() scheduleId!: string;
  @IsString() @IsISO8601({ strict: true }) date!: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  daysBetweenMatches = 1;
}
