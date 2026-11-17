import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, IsString, ValidateIf } from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

export class LeagueTeamDto {
  @Expose() @IsBigintId() id!: string;
  @Expose() @IsString() name!: string;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsString()
  image!: string | null;
  @ApiProperty({ type: String, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsString()
  captainName!: string | null;
  @ApiProperty({ type: Number, nullable: true })
  @Expose()
  @ValidateIf((_o, value: unknown) => value !== null)
  @IsInt()
  groupNumber!: number | null;
}
