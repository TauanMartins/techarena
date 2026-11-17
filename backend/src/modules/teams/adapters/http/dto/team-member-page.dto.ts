import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { PageResponseDto } from '../../../../../common/http/dto/pagination.dto.js';
import { TeamMemberDto } from './team-member.dto.js';
export class TeamMemberPageDto extends PageResponseDto {
  @ApiProperty({ type: [TeamMemberDto] })
  @Expose()
  @IsArray()
  @Type(() => TeamMemberDto)
  @ValidateNested({ each: true })
  items!: TeamMemberDto[];
}
