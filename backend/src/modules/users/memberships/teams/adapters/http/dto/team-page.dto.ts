import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { PageResponseDto } from '../../../../../shared/http/dto/pagination.dto.js';
import { TeamResponseDto } from './team-response.dto.js';
export class TeamPageDto extends PageResponseDto {
  @ApiProperty({ type: [TeamResponseDto] })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamResponseDto)
  items!: TeamResponseDto[];
}
