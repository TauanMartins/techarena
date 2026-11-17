import { Expose } from 'class-transformer';
import { IsInt, IsString, Min } from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

export class SportDto {
  @Expose() @IsBigintId() id!: string;
  @Expose() @IsString() name!: string;
  @Expose() @IsInt() @Min(1) defaultPlayers!: number;
}
