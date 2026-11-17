import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { PageResponseDto } from '../../../../../common/http/dto/pagination.dto.js';
import { ArenaDto } from './arena.dto.js';
export class ArenaPageDto extends PageResponseDto {
  @ApiProperty({ type: [ArenaDto] })
  @Expose()
  @IsArray()
  @Type(() => ArenaDto)
  @ValidateNested({ each: true })
  items!: ArenaDto[];
}
