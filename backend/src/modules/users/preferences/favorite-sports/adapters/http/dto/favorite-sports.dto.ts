import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { Equals, IsArray, IsInt, Min, ValidateNested } from 'class-validator';
import { MAX_FAVORITE_SPORTS } from '../../../domain/favorite-sports.js';
import { SportResponseDto } from './sport-response.dto.js';
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
