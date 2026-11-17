import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

export class RegisterLeagueTeamDto {
  @IsBigintId() teamId!: string;
}
