import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';
import { LeagueMatchResultDto } from './league-match-result.dto.js';
import { LeagueTeamDto } from './league-team.dto.js';
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
