import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsISO8601, IsString, ValidateIf } from 'class-validator';
import { IsBigintId } from '../../../../../../../common/http/bigint-id.validator.js';

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
