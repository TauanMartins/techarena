import { Expose, Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsBigintId } from '../../../../../../common/http/bigint-id.validator.js';

import { PageResponseDto } from '../../../../shared/http/pagination.dto.js';

export class TeamResponseDto {
  @Expose()
  @IsBigintId()
  id!: string;
  @Expose()
  @IsString()
  name!: string;
  @Expose()
  @IsString()
  role!: string;
}
export class TeamPageDto extends PageResponseDto {
  @ApiProperty({ type: [TeamResponseDto] })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamResponseDto)
  items!: TeamResponseDto[];
}
