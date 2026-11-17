import { IsISO8601, IsString } from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

export class LeagueAvailabilityQueryDto {
  @IsBigintId() arenaId!: string;
  @IsString() @IsISO8601({ strict: true }) date!: string;
}
