import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { LeagueTeamInvitationDto } from './league-team-invitation.dto.js';
export class LeagueTeamInvitationsDto {
  @Expose()
  @IsArray()
  @Type(() => LeagueTeamInvitationDto)
  @ValidateNested({ each: true })
  items!: LeagueTeamInvitationDto[];
}
