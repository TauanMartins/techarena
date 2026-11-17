import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

export class LeagueInvitationParamsDto {
  @IsBigintId() invitationId!: string;
}
