import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';
import { LeagueIdDto } from './league-id.dto.js';
export class LeagueMatchIdDto extends LeagueIdDto {
  @IsBigintId() matchId!: string;
}
