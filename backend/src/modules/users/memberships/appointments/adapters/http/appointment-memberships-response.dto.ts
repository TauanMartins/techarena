import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsISO8601,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsBigintId } from '../../../../../../common/http/bigint-id.validator.js';

import { PageResponseDto } from '../../../../shared/http/pagination.dto.js';

export class AppointmentResponseDto {
  @Expose()
  @IsBigintId()
  id!: string;
  @Expose()
  @IsString()
  title!: string;
  @Expose()
  @IsISO8601({ strict: true })
  scheduledAt!: string;
  @Expose()
  @IsIn(['scheduled', 'in_progress', 'finished', 'canceled'])
  status!: string;
  @Expose()
  @IsBoolean()
  holder!: boolean;
}
export class AppointmentPageDto extends PageResponseDto {
  @ApiProperty({ type: [AppointmentResponseDto] })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppointmentResponseDto)
  items!: AppointmentResponseDto[];
}
