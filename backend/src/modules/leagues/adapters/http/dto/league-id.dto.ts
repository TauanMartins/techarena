import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

export class LeagueIdDto {
  @IsBigintId() leagueId!: string;
}
