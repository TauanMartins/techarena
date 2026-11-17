import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';
import { PaginationQueryDto } from '../../../../../common/http/dto/pagination.dto.js';

export class SportMaterialsQueryDto extends PaginationQueryDto {
  @IsBigintId() sportId!: string;
}
