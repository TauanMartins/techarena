import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';
import { GeoPageQueryDto } from '../../../../../common/http/dto/geo-query.dto.js';

export class ArenaSportQueryDto extends GeoPageQueryDto {
  @IsBigintId() sportId!: string;
}
