import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { PageResponseDto } from '../../../../../common/http/dto/pagination.dto.js';
import { SportDto } from './sport.dto.js';
export class SportPageDto extends PageResponseDto {
  @ApiProperty({ type: [SportDto] })
  @Expose()
  @IsArray()
  @Type(() => SportDto)
  @ValidateNested({ each: true })
  items!: SportDto[];
}
