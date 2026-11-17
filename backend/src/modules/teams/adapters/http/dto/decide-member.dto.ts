import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { InviteMemberDto } from './invite-member.dto.js';
export class DecideMemberDto extends InviteMemberDto {
  @ApiPropertyOptional({ enum: ['accept', 'decline'], default: 'accept' })
  @IsIn(['accept', 'decline'])
  action: 'accept' | 'decline' = 'accept';
}
