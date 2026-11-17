import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsString,
  ValidateIf,
} from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

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
