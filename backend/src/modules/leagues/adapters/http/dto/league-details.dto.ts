import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';
import { LeagueMatchDto } from './league-match.dto.js';
import { LeagueStandingDto } from './league-standing.dto.js';
import { LeagueSummaryDto } from './league-summary.dto.js';
import { LeagueTeamDto } from './league-team.dto.js';
import { LeagueTeamInvitationDto } from './league-team-invitation.dto.js';
export class LeagueDetailsDto {
  @Expose()
  @Type(() => LeagueSummaryDto)
  @ValidateNested()
  league!: LeagueSummaryDto;
  @Expose()
  @IsArray()
  @Type(() => LeagueTeamDto)
  @ValidateNested({ each: true })
  teams!: LeagueTeamDto[];
  @Expose()
  @IsArray()
  @Type(() => LeagueTeamInvitationDto)
  @ValidateNested({ each: true })
  invitations!: LeagueTeamInvitationDto[];
  @Expose()
  @IsArray()
  @Type(() => LeagueMatchDto)
  @ValidateNested({ each: true })
  matches!: LeagueMatchDto[];
  @Expose()
  @IsArray()
  @Type(() => LeagueStandingDto)
  @ValidateNested({ each: true })
  standings!: LeagueStandingDto[];
  @Expose() @IsArray() @IsBigintId({ each: true }) myCaptainTeamIds!: string[];
}
