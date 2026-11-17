import { IsISO8601, IsString, Matches } from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

export class AvailabilityQueryDto {
  @IsBigintId() sportId!: string;
  @IsBigintId() arenaId!: string;
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsISO8601({ strict: true })
  date!: string;
}
