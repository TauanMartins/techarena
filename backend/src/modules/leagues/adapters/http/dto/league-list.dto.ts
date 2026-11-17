import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { LeagueSummaryDto } from './league-summary.dto.js';
export class LeagueListDto {
  @Expose()
  @IsArray()
  @Type(() => LeagueSummaryDto)
  @ValidateNested({ each: true })
  items!: LeagueSummaryDto[];
}
