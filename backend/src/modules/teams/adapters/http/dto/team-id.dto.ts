import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';
export class TeamIdDto {
  @IsBigintId() teamId!: string;
}
