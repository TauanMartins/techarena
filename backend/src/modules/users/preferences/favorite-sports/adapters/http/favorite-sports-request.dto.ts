import { MAX_FAVORITE_SPORTS } from '../../domain/favorite-sports.js';
import { ArrayMaxSize, ArrayUnique, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsBigintId } from '../../../../../../common/http/bigint-id.validator.js';

export class ReplaceSportsDto {
  @ApiProperty({
    type: [String],
    maxItems: MAX_FAVORITE_SPORTS,
    uniqueItems: true,
    example: ['1', '2'],
  })
  @IsArray()
  @ArrayMaxSize(MAX_FAVORITE_SPORTS)
  @ArrayUnique()
  @IsBigintId({ each: true })
  sportIds!: string[];
}
