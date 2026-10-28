import { Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeoPageQueryDto } from '../../../../common/http/geo-query.dto.js';
import { PageResponseDto } from '../../../../common/http/pagination.dto.js';
import { IsBigintId } from '../../../../common/http/bigint-id.validator.js';
export class AppointmentsQueryDto extends GeoPageQueryDto {
  @IsOptional() @IsBigintId() sportId?: string;
  @IsOptional() @IsBigintId() arenaId?: string;
  @ApiPropertyOptional({ default: false })
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  preferSports: boolean = false;
  @ApiPropertyOptional({ enum: ['recent', 'future'], default: 'recent' })
  @IsIn(['recent', 'future'])
  orderByTime: 'recent' | 'future' = 'recent';
  @ApiPropertyOptional({ enum: ['near', 'far'], default: 'near' })
  @IsIn(['near', 'far'])
  distance: 'near' | 'far' = 'near';
}
export class AvailabilityQueryDto {
  @IsBigintId() sportId!: string;
  @IsBigintId() arenaId!: string;
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsISO8601({ strict: true })
  date!: string;
}
export class CreateAppointmentDto extends AvailabilityQueryDto {
  @IsBigintId() scheduleId!: string;
  @IsOptional() @IsString() @Length(1, 100) title?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  holder: boolean = true;
  @IsOptional() @IsInt() @Min(1) @Max(1000) maxPlayers?: number;
}
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
}
export class BookingPageDto extends PageResponseDto {
  @ApiProperty({ type: [BookingDto] })
  @Expose()
  @IsArray()
  @Type(() => BookingDto)
  @ValidateNested({ each: true })
  items!: BookingDto[];
}
export class ScheduleDto {
  @Expose() @IsBigintId() id!: string;
  @Expose() @IsString() horary!: string;
}
export class AvailabilityDto {
  @ApiProperty({ type: [ScheduleDto] })
  @Expose()
  @IsArray()
  @Type(() => ScheduleDto)
  @ValidateNested({ each: true })
  items!: ScheduleDto[];
}
