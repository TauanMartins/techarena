import { ArrayMaxSize, ArrayUnique, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsBigintId } from '../../../../../../common/http/bigint-id.validator.js';

export class ReplaceSportsDto {
  @ApiProperty({
    type: [String],
    maxItems: 4,
    uniqueItems: true,
    example: ['1', '2'],
  })
  @IsArray()
  @ArrayMaxSize(4)
  @ArrayUnique()
  @IsBigintId({ each: true })
  sportIds!: string[];
}
