import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { PaginationQueryDto } from '../../../../../shared/http/dto/pagination.dto.js';
export class TeamMembershipQueryDto extends PaginationQueryDto {
  /** Filter by team name. */
  @IsOptional()
  @IsString()
  @Length(2, 100)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;
  @IsOptional()
  @IsIn(['captain', 'member'])
  role?: 'captain' | 'member';
  @ApiPropertyOptional({ enum: ['joinedAt', 'name'], default: 'joinedAt' })
  @IsIn(['joinedAt', 'name'])
  sortBy: 'joinedAt' | 'name' = 'joinedAt';
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'asc';
}
