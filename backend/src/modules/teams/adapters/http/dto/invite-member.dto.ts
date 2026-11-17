import { IsUUID } from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

export class InviteMemberDto {
  @IsBigintId() teamId!: string;
  @IsUUID() userId!: string;
}
