import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

import { PaginationQueryDto } from '../../../shared/http/pagination.dto.js';

export class SearchUsersQueryDto extends PaginationQueryDto {
  /** Search by username or display name. */
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(2, 100)
  search!: string;
}
