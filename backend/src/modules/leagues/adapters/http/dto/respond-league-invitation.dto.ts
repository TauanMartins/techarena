import { IsIn } from 'class-validator';

export class RespondLeagueInvitationDto {
  @IsIn(['accept', 'decline']) action!: 'accept' | 'decline';
}
