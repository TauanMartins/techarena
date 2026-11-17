import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { PageResponseDto } from '../../../../../common/http/dto/pagination.dto.js';
import { TeamDto } from './team.dto.js';
export class TeamCatalogPageDto extends PageResponseDto {
  @ApiProperty({ type: [TeamDto] })
  @Expose()
  @IsArray()
  @Type(() => TeamDto)
  @ValidateNested({ each: true })
  items!: TeamDto[];
}
