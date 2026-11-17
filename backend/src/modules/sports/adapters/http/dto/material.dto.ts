import { Expose } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

export class MaterialDto {
  @Expose() @IsBigintId() id!: string;
  @Expose() @IsString() description!: string;
  @Expose() @IsBoolean() relatedToLocal!: boolean;
}
