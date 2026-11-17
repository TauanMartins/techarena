import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

export class RequestIdDto {
  @IsBigintId() requestId!: string;
}
