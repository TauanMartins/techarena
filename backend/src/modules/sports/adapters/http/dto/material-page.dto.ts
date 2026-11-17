import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { PageResponseDto } from '../../../../../common/http/dto/pagination.dto.js';
import { MaterialDto } from './material.dto.js';
export class MaterialPageDto extends PageResponseDto {
  @ApiProperty({ type: [MaterialDto] })
  @Expose()
  @IsArray()
  @Type(() => MaterialDto)
  @ValidateNested({ each: true })
  items!: MaterialDto[];
}
