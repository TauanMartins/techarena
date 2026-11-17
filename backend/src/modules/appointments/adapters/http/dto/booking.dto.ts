import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';
import { AppointmentParticipantDto } from './appointment-participant.dto.js';
export class BookingDto {
  @Expose() @IsBigintId() id!: string;
  @Expose() @IsString() title!: string;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, v: unknown) => v !== null)
  @IsString()
  description!: string | null;
  @Expose() @IsISO8601() scheduledAt!: string;
  @Expose()
  @IsIn(['scheduled', 'in_progress', 'finished', 'canceled'])
  status!: string;
  @Expose() @IsUUID() organizerId!: string;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, v: unknown) => v !== null)
  @IsBigintId()
  arenaId!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, v: unknown) => v !== null)
  @IsBigintId()
  sportId!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, v: unknown) => v !== null)
  @IsBigintId()
  scheduleId!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, v: unknown) => v !== null)
  @IsString()
  arenaAddress!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, v: unknown) => v !== null)
  @IsString()
  arenaImage!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, v: unknown) => v !== null)
  @IsString()
  sportName!: string | null;
  @ApiProperty({ type: Number, nullable: true })
  @Expose()
  @ValidateIf((_o, v: unknown) => v !== null)
  @IsInt()
  maxPlayers!: number | null;
  @Expose() @IsInt() @Min(0) players!: number;
  @Expose() @IsInt() @Min(0) startingPlayers!: number;
  @Expose() @IsBoolean() isInside!: boolean;
  @ApiProperty({ type: Number, nullable: true })
  @Expose()
  @ValidateIf((_o, v: unknown) => v !== null)
  @IsNumber()
  distanceKm!: number | null;
  @ApiProperty({ type: [AppointmentParticipantDto] })
  @Expose()
  @IsArray()
  @Type(() => AppointmentParticipantDto)
  @ValidateNested({ each: true })
  participants!: AppointmentParticipantDto[];
}
