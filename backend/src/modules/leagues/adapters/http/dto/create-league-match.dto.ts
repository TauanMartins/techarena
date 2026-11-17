import { IsISO8601, IsString } from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

export class CreateLeagueMatchDto {
  @IsBigintId() homeTeamId!: string;
  @IsBigintId() awayTeamId!: string;
  @IsBigintId() arenaId!: string;
  @IsBigintId() scheduleId!: string;
  @IsString() @IsISO8601({ strict: true }) date!: string;
}
