import { IsUUID } from 'class-validator';
import { TeamIdDto } from './team-id.dto.js';
export class TeamMemberParamsDto extends TeamIdDto {
  @IsUUID() userId!: string;
}
