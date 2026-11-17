import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, Min, ValidateIf } from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

export class LeagueMatchResultDto {
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsBigintId()
  winnerTeamId!: string | null;
  @Expose() @IsInt() @Min(0) homeScore!: number;
  @Expose() @IsInt() @Min(0) awayScore!: number;
}
