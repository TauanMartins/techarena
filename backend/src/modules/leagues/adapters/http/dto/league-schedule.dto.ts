import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

export class LeagueScheduleDto {
  @Expose() @IsBigintId() id!: string;
  @Expose() @IsString() horary!: string;
}
