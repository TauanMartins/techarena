import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class RecordLeagueResultDto {
  @Type(() => Number) @IsInt() @Min(0) @Max(100000) homeScore!: number;
  @Type(() => Number) @IsInt() @Min(0) @Max(100000) awayScore!: number;
}
