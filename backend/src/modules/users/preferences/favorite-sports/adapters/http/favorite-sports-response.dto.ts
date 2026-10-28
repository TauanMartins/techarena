import { Expose, Type } from 'class-transformer';
import { MAX_FAVORITE_SPORTS } from '../../domain/favorite-sports.js';
import {
  IsArray,
  IsString,
  ValidateNested,
  IsInt,
  Equals,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsBigintId } from '../../../../../../common/http/bigint-id.validator.js';

export class SportResponseDto {
  @Expose()
  @IsBigintId()
  id!: string;
  @Expose()
  @IsString()
  name!: string;
}
export class FavoriteSportsDto {
  @Expose()
  @IsInt()
  @Equals(MAX_FAVORITE_SPORTS)
  maxFavorites!: number;
  @Expose()
  @IsInt()
  @Min(0)
  remainingSlots!: number;

  @ApiProperty({ type: [SportResponseDto] })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SportResponseDto)
  items!: SportResponseDto[];
}
