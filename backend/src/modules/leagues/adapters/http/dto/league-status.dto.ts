import { IsIn } from 'class-validator';

export class LeagueStatusDto {
  @IsIn(['completed', 'canceled']) status!: 'completed' | 'canceled';
}
