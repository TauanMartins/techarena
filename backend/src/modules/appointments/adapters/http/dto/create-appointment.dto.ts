import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';
import { AvailabilityQueryDto } from './availability-query.dto.js';
export class CreateAppointmentDto extends AvailabilityQueryDto {
  @IsBigintId() scheduleId!: string;
  @IsOptional() @IsString() @Length(1, 100) title?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  holder: boolean = true;
  @IsOptional() @IsInt() @Min(1) @Max(1000) maxPlayers?: number;
}
