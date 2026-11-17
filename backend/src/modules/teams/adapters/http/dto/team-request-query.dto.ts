import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';
import { PaginationQueryDto } from '../../../../../common/http/dto/pagination.dto.js';

export class TeamRequestQueryDto extends PaginationQueryDto {
  @IsBigintId() teamId!: string;
}
