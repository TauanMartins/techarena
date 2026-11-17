import { Expose } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class TeamExistsDto {
  @Expose() @IsBoolean() exists!: boolean;
}
