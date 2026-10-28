import { Expose, Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';
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
  @ApiProperty({ type: [SportResponseDto] })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SportResponseDto)
  items!: SportResponseDto[];
}
