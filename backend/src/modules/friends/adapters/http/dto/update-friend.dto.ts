import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { IsBigintId } from '../../../../../common/http/bigint-id.validator.js';

export class UpdateFriendDto {
  @IsBigintId() friendId!: string;
  @ApiPropertyOptional({ enum: ['accept', 'block'], default: 'accept' })
  @IsIn(['accept', 'block'])
  action: 'accept' | 'block' = 'accept';
}
