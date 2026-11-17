import { Transform } from 'class-transformer';
import { IsIn, IsString, Length } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../../shared/http/dto/pagination.dto.js';

export class SearchUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['all', 'username', 'name'], default: 'all' })
  @IsIn(['all', 'username', 'name'])
  searchBy: 'all' | 'username' | 'name' = 'all';
  @ApiPropertyOptional({ enum: ['username', 'name'], default: 'username' })
  @IsIn(['username', 'name'])
  sortBy: 'username' | 'name' = 'username';
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'asc';

  /** Search by username or display name. */
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(2, 100)
  search!: string;
}
