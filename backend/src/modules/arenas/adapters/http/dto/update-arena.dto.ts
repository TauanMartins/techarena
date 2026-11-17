import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';
import { CreateArenaDto } from './create-arena.dto.js';
export class UpdateArenaDto extends CreateArenaDto {
  @IsBigintId() arenaId!: string;
}
