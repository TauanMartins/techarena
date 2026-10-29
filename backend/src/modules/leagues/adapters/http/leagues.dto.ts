import { Expose, Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsBigintId } from '../../../../common/http/bigint-id.validator.js';

export class LeagueIdDto {
  @IsBigintId() leagueId!: string;
}

export class LeagueMatchIdDto extends LeagueIdDto {
  @IsBigintId() matchId!: string;
}

export class LeagueTeamParamsDto extends LeagueIdDto {
  @IsBigintId() teamId!: string;
}

export class LeagueInvitationParamsDto {
  @IsBigintId() invitationId!: string;
}

export class CreateLeagueDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 45)
  name!: string;

  @IsOptional() @IsString() @MaxLength(500) description?: string | null;
  @IsBigintId() sportId!: string;
  @IsOptional()
  @IsIn(['round_robin', 'knockout', 'groups_knockout'])
  tournamentFormat: 'round_robin' | 'knockout' | 'groups_knockout' =
    'round_robin';
  @IsOptional() @Type(() => Number) @IsInt() @Min(2) @Max(16) groupCount = 2;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  qualifiersPerGroup = 2;
}

export class UpdateLeagueDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 45)
  name?: string;

  @IsOptional() @IsString() @MaxLength(500) description?: string | null;
  @IsOptional() @IsBigintId() sportId?: string;
  @IsOptional()
  @IsIn(['round_robin', 'knockout', 'groups_knockout'])
  tournamentFormat?: 'round_robin' | 'knockout' | 'groups_knockout';
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(16)
  groupCount?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  qualifiersPerGroup?: number;
}

export class LeagueStatusDto {
  @IsIn(['completed', 'canceled']) status!: 'completed' | 'canceled';
}

export class RegisterLeagueTeamDto {
  @IsBigintId() teamId!: string;
}

export class InviteLeagueTeamDto extends RegisterLeagueTeamDto {}

export class RespondLeagueInvitationDto {
  @IsIn(['accept', 'decline']) action!: 'accept' | 'decline';
}

export class CreateLeagueMatchDto {
  @IsBigintId() homeTeamId!: string;
  @IsBigintId() awayTeamId!: string;
  @IsBigintId() arenaId!: string;
  @IsBigintId() scheduleId!: string;
  @IsString() @IsISO8601({ strict: true }) date!: string;
}

export class RecordLeagueResultDto {
  @Type(() => Number) @IsInt() @Min(0) @Max(100000) homeScore!: number;
  @Type(() => Number) @IsInt() @Min(0) @Max(100000) awayScore!: number;
}

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

export class LeagueSummaryDto {
  @Expose() @IsBigintId() id!: string;
  @Expose() @IsString() name!: string;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsString()
  description!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsString()
  image!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsString()
  ownerId!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsString()
  ownerName!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsBigintId()
  sportId!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsString()
  sportName!: string | null;
  @Expose()
  @IsIn(['round_robin', 'knockout', 'groups_knockout'])
  tournamentFormat!: 'round_robin' | 'knockout' | 'groups_knockout';
  @Expose() @IsIn(['open', 'active', 'completed', 'canceled']) status!: string;
  @Expose() @IsInt() @Min(2) @Max(16) groupCount!: number;
  @Expose() @IsInt() @Min(1) @Max(8) qualifiersPerGroup!: number;
  @Expose() @IsISO8601() createdAt!: string;
  @Expose() @IsInt() @Min(0) teamCount!: number;
  @Expose() @IsInt() @Min(0) matchCount!: number;
  @Expose() @IsInt() @Min(0) completedMatchCount!: number;
  @Expose() @IsBoolean() isOwner!: boolean;
}

export class LeagueTeamDto {
  @Expose() @IsBigintId() id!: string;
  @Expose() @IsString() name!: string;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsString()
  image!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsString()
  captainName!: string | null;
  @ApiProperty({ type: Number, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsInt()
  groupNumber!: number | null;
}

export class LeagueMatchResultDto {
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsBigintId()
  winnerTeamId!: string | null;
  @Expose() @IsInt() @Min(0) homeScore!: number;
  @Expose() @IsInt() @Min(0) awayScore!: number;
}

export class LeagueMatchDto {
  @Expose() @IsBigintId() id!: string;
  @Expose() @IsBigintId() appointmentId!: string;
  @Expose() @IsInt() @Min(1) matchNumber!: number;
  @Expose() @IsISO8601() scheduledAt!: string;
  @Expose() @IsString() status!: string;
  @Expose() @IsBoolean() resultAllowed!: boolean;
  @Expose() @IsIn(['manual', 'group', 'knockout']) phase!: string;
  @Expose() @IsInt() @Min(1) roundNumber!: number;
  @ApiProperty({ type: Number, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsInt()
  groupNumber!: number | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsString()
  arenaAddress!: string | null;
  @Expose()
  @Type(() => LeagueTeamDto)
  @ValidateNested()
  homeTeam!: LeagueTeamDto;
  @Expose()
  @Type(() => LeagueTeamDto)
  @ValidateNested()
  awayTeam!: LeagueTeamDto;
  @ApiProperty({ type: LeagueMatchResultDto, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @Type(() => LeagueMatchResultDto)
  @ValidateNested()
  result!: LeagueMatchResultDto | null;
}

export class LeagueStandingDto {
  @Expose() @IsBigintId() teamId!: string;
  @Expose() @IsString() teamName!: string;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsString()
  image!: string | null;
  @ApiProperty({ type: Number, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsInt()
  groupNumber!: number | null;
  @Expose() @IsInt() @Min(0) played!: number;
  @Expose() @IsInt() @Min(0) wins!: number;
  @Expose() @IsInt() @Min(0) losses!: number;
  @Expose() @IsInt() @Min(0) draws!: number;
  @Expose() @IsInt() @Min(0) points!: number;
  @Expose() @IsInt() @Min(0) scoreFor!: number;
  @Expose() @IsInt() @Min(0) scoreAgainst!: number;
}

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

export class LeagueTeamInvitationDto {
  @Expose() @IsBigintId() id!: string;
  @Expose() @IsBigintId() leagueId!: string;
  @Expose() @IsString() leagueName!: string;
  @Expose() @IsBigintId() teamId!: string;
  @Expose() @IsString() teamName!: string;
  @Expose() @IsISO8601() invitedAt!: string;
}

export class LeagueTeamInvitationsDto {
  @Expose()
  @IsArray()
  @Type(() => LeagueTeamInvitationDto)
  @ValidateNested({ each: true })
  items!: LeagueTeamInvitationDto[];
}

export class LeagueListDto {
  @Expose()
  @IsArray()
  @Type(() => LeagueSummaryDto)
  @ValidateNested({ each: true })
  items!: LeagueSummaryDto[];
}

export class LeagueArenaDto {
  @Expose() @IsBigintId() id!: string;
  @Expose() @IsString() address!: string;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsString()
  image!: string | null;
}

export class LeagueArenasDto {
  @Expose()
  @IsArray()
  @Type(() => LeagueArenaDto)
  @ValidateNested({ each: true })
  items!: LeagueArenaDto[];
}

export class LeagueAvailabilityQueryDto {
  @IsBigintId() arenaId!: string;
  @IsString() @IsISO8601({ strict: true }) date!: string;
}

export class LeagueScheduleDto {
  @Expose() @IsBigintId() id!: string;
  @Expose() @IsString() horary!: string;
}

export class LeagueAvailabilityDto {
  @Expose()
  @IsArray()
  @Type(() => LeagueScheduleDto)
  @ValidateNested({ each: true })
  items!: LeagueScheduleDto[];
}

export class LeagueMutationResultDto {
  @Expose() @IsBoolean() success!: boolean;
}
