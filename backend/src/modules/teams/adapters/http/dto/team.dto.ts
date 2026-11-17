import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsISO8601, IsString, ValidateIf } from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

export class TeamDto {
  @Expose() @IsBigintId() id!: string;
  @Expose() @IsString() name!: string;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, v: unknown) => v !== null)
  @IsString()
  description!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, v: unknown) => v !== null)
  @IsString()
  image!: string | null;
  @Expose() @IsISO8601() createdAt!: string;
}
