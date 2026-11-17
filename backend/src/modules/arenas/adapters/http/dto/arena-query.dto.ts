import { IsOptional, IsString, Length } from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';
import { GeoPageQueryDto } from '../../../../../common/http/dto/geo-query.dto.js';

export class ArenaQueryDto extends GeoPageQueryDto {
  @IsOptional() @IsBigintId() arenaId?: string;
  @IsOptional() @IsString() @Length(1, 150) search?: string;
  @IsOptional() @IsBigintId() sportId?: string;
}
