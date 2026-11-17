import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

export class JoinTeamDto {
  @IsBigintId() teamId!: string;
}
