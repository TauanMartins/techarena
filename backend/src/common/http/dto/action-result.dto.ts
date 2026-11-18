import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { Expose } from 'class-transformer';
export class ActionResultDto {
  @Expose() @ApiProperty() @IsBoolean() success!: boolean;
}
