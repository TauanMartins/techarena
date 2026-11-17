import { Expose } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class LeagueMutationResultDto {
  @Expose() @IsBoolean() success!: boolean;
}
