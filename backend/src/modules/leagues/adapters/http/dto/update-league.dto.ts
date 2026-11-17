import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

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
