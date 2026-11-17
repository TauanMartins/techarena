import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';
import { PaginationQueryDto } from '../../../../../common/http/dto/pagination.dto.js';

export class ArenaSportsQueryDto extends PaginationQueryDto {
  @IsBigintId() arenaId!: string;
}
