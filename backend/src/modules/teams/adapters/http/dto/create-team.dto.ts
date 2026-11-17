import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { TeamNameQueryDto } from './team-name-query.dto.js';
export class CreateTeamDto extends TeamNameQueryDto {
  @IsOptional() @IsString() @MaxLength(2000) description?: string | null;
  @ApiProperty({ type: String, nullable: true, required: false })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(255)
  image?: string | null;
}
