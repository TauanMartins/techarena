import { GeoPageQueryDto } from '../../../../common/http/geo-query.dto.js';
import { Expose, Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PageResponseDto } from '../../../../common/http/pagination.dto.js';
import { IsBigintId } from '../../../../common/http/bigint-id.validator.js';
export class ArenaQueryDto extends GeoPageQueryDto {
  @IsOptional() @IsString() @Length(1, 150) search?: string;
  @IsOptional() @IsBigintId() sportId?: string;
}
export class ArenaSportQueryDto extends GeoPageQueryDto {
  @IsBigintId() sportId!: string;
}
export class CreateArenaDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 150)
  address!: string;
  @IsNumber() @Min(-90) @Max(90) lat!: number;
  @IsNumber() @Min(-180) @Max(180) longitude!: number;
  @ApiProperty({ type: String, nullable: true, required: false })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(150)
  image?: string | null;
  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  isLeagueOnly: boolean = false;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsBigintId({ each: true })
  sportIds!: string[];
}
export class UpdateArenaDto extends CreateArenaDto {
  @IsBigintId() arenaId!: string;
}
export class ArenaDto {
  @Expose() @IsBigintId() id!: string;
  @Expose() @IsString() address!: string;
  @Expose() @IsNumber() lat!: number;
  @Expose() @IsNumber() longitude!: number;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, v: unknown) => v !== null)
  @IsString()
  image!: string | null;
  @Expose() @IsBoolean() isLeagueOnly!: boolean;
  @Expose() @IsArray() @IsBigintId({ each: true }) sportIds!: string[];
  @ApiProperty({ type: Number, nullable: true })
  @Expose()
  @ValidateIf((_o, v: unknown) => v !== null)
  @IsNumber()
  distanceKm!: number | null;
}
export class ArenaPageDto extends PageResponseDto {
  @ApiProperty({ type: [ArenaDto] })
  @Expose()
  @IsArray()
  @Type(() => ArenaDto)
  @ValidateNested({ each: true })
  items!: ArenaDto[];
}
