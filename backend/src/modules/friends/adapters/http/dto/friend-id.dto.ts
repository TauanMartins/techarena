import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';
export class FriendIdDto {
  @IsBigintId() friendId!: string;
}
