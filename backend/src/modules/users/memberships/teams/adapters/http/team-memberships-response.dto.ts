import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsString,
  IsISO8601,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsBigintId } from '../../../../../../common/http/bigint-id.validator.js';

import { PageResponseDto } from '../../../../shared/http/pagination.dto.js';

export class TeamResponseDto {
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsString()
  description!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsString()
  image!: string | null;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsISO8601({ strict: true })
  joinedAt!: string | null;

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
