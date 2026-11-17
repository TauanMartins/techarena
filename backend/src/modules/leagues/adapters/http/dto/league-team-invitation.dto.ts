import { Expose } from 'class-transformer';
import { IsISO8601, IsString } from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

export class LeagueTeamInvitationDto {
  @Expose() @IsBigintId() id!: string;
  @Expose() @IsBigintId() leagueId!: string;
  @Expose() @IsString() leagueName!: string;
  @Expose() @IsBigintId() teamId!: string;
  @Expose() @IsString() teamName!: string;
  @Expose() @IsISO8601() invitedAt!: string;
}
