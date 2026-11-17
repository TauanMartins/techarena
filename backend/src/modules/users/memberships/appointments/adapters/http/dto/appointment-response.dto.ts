import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { IsBigintId } from '../../../../../../../common/http/bigint-id.validator.js';

export class AppointmentResponseDto {
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsString()
  description!: string | null;
  @Expose()
  @IsUUID()
  organizerId!: string;
  @Expose()
  @IsBoolean()
  isOrganizer!: boolean;
  @ApiProperty({ type: Number, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsInt()
  maxPlayers!: number | null;

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
