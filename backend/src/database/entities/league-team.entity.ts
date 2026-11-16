import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import type { League } from './league.entity.js';
import type { Team } from './team.entity.js';

@Entity({ name: 'league_team', schema: 'public' })
@Index('league_team_league_id_index', ['leagueId'])
@Check(
  'league_team_group_number_check',
  'group_number IS NULL OR group_number > 0',
)
export class LeagueTeam {
  @Column({ name: 'group_number', type: 'integer', nullable: true })
  groupNumber!: number | null;

  @PrimaryColumn({
    name: 'team_id',
    type: 'bigint',
    nullable: false,
    comment:
      'Referência a identificador do time relacionada à tabela league_team.',
    primaryKeyConstraintName: 'league_team_pkey',
  })
  teamId!: string;

  @PrimaryColumn({
    name: 'league_id',
    type: 'bigint',
    nullable: false,
    comment: 'Referência a league id relacionada à tabela league_team.',
    primaryKeyConstraintName: 'league_team_pkey',
  })
  leagueId!: string;

  @ManyToOne('Team', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'team_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'league_team_team_id_fkey',
  })
  team!: Team;

  @ManyToOne('League', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'league_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'league_team_league_id_fkey',
  })
  league!: League;
}
