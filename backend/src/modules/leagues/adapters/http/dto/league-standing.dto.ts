import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, IsString, Min, ValidateIf } from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

export class LeagueStandingDto {
  @Expose() @IsBigintId() teamId!: string;
  @Expose() @IsString() teamName!: string;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsString()
  image!: string | null;
  @ApiProperty({ type: Number, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsInt()
  groupNumber!: number | null;
  @Expose() @IsInt() @Min(0) played!: number;
  @Expose() @IsInt() @Min(0) wins!: number;
  @Expose() @IsInt() @Min(0) losses!: number;
  @Expose() @IsInt() @Min(0) draws!: number;
  @Expose() @IsInt() @Min(0) points!: number;
  @Expose() @IsInt() @Min(0) scoreFor!: number;
  @Expose() @IsInt() @Min(0) scoreAgainst!: number;
}
