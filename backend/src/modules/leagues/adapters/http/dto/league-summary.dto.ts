import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

export class LeagueSummaryDto {
  @Expose() @IsBigintId() id!: string;
  @Expose() @IsString() name!: string;
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
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsString()
  ownerId!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsString()
  ownerName!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsBigintId()
  sportId!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsString()
  sportName!: string | null;
  @Expose()
  @IsIn(['round_robin', 'knockout', 'groups_knockout'])
  tournamentFormat!: 'round_robin' | 'knockout' | 'groups_knockout';
  @Expose() @IsIn(['open', 'active', 'completed', 'canceled']) status!: string;
  @Expose() @IsInt() @Min(2) @Max(16) groupCount!: number;
  @Expose() @IsInt() @Min(1) @Max(8) qualifiersPerGroup!: number;
  @Expose() @IsISO8601() createdAt!: string;
  @Expose() @IsInt() @Min(0) teamCount!: number;
  @Expose() @IsInt() @Min(0) matchCount!: number;
  @Expose() @IsInt() @Min(0) completedMatchCount!: number;
  @Expose() @IsBoolean() isOwner!: boolean;
}
