import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { Team } from './team.entity.js';
import type { User } from './users.entity.js';

@Entity({ name: 'user_team', schema: 'public' })
@Unique('user_team_user_team_unique', ['userId', 'teamId'])
@Index('user_team_team_id_index', ['teamId'])
export class UserTeam {
  @PrimaryGeneratedColumn('identity', {
    name: 'id',
    type: 'bigint',
    comment: 'Identificador único do registro da tabela user_team.',
    primaryKeyConstraintName: 'user_team_pkey',
  })
  id!: string;

  @Column({
    name: 'user_id',
    type: 'uuid',
    nullable: false,
    comment:
      'Referência a identificador do usuário relacionada à tabela user_team.',
  })
  userId!: string;

  @Column({
    name: 'team_id',
    type: 'bigint',
    nullable: false,
    comment:
      'Referência a identificador do time relacionada à tabela user_team.',
  })
  teamId!: string;

  @Column({
    name: 'role',
    type: 'varchar',
    length: 20,
    nullable: false,
    comment: 'captain, member',
    default: 'member',
  })
  role!: string;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Data e hora de criação do registro.',
  })
  createdAt!: Date | null;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Data e hora da última atualização do registro.',
  })
  updatedAt!: Date | null;

  @ManyToOne('User', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'user_team_user_id_fkey',
  })
  user!: User;

  @ManyToOne('Team', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'team_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'user_team_team_id_fkey',
  })
  team!: Team;
}
