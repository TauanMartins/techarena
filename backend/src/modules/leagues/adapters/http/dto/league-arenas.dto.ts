import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { LeagueArenaDto } from './league-arena.dto.js';
export class LeagueArenasDto {
  @Expose()
  @IsArray()
  @Type(() => LeagueArenaDto)
  @ValidateNested({ each: true })
  items!: LeagueArenaDto[];
}
