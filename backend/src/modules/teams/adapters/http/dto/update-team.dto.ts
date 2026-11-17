import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';
import { CreateTeamDto } from './create-team.dto.js';
export class UpdateTeamDto extends CreateTeamDto {
  @IsBigintId() teamId!: string;
}
