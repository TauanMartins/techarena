import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { Appointment } from './appointment.entity.js';
import type { Team } from './team.entity.js';

@Entity({ name: 'appointment_result', schema: 'public' })
@Unique('appointment_result_one_per_appointment', ['appointmentId'])
@Check(
  'appointment_result_scores_non_negative',
  '(winner_score IS NULL OR winner_score >= 0)\n        AND (loser_score IS NULL OR loser_score >= 0)',
)
@Check(
  'appointment_result_different_teams',
  'winner_team_id IS NULL OR loser_team_id IS NULL OR winner_team_id <> loser_team_id',
)
@Check(
  'appointment_result_team_pair',
  '(winner_team_id IS NULL) = (loser_team_id IS NULL)',
)
@Check(
  'appointment_result_score_pair',
  '(winner_score IS NULL) = (loser_score IS NULL)',
)
@Index('appointment_result_winner_team_id_index', ['winnerTeamId'])
@Index('appointment_result_loser_team_id_index', ['loserTeamId'])
export class AppointmentResult {
  @PrimaryGeneratedColumn('identity', {
    name: 'id',
    type: 'bigint',
    comment: 'Identificador único do registro da tabela appointment_result.',
    primaryKeyConstraintName: 'appointment_result_pkey',
  })
  id!: string;

  @Column({
    name: 'appointment_id',
    type: 'bigint',
    nullable: false,
    comment:
      'Referência a identificador do agendamento relacionada à tabela appointment_result.',
  })
  appointmentId!: string;

  @Column({
    name: 'winner_team_id',
    type: 'bigint',
    nullable: true,
    comment:
      'Referência a identificador do time vencedor relacionada à tabela appointment_result.',
  })
  winnerTeamId!: string | null;

  @Column({
    name: 'loser_team_id',
    type: 'bigint',
    nullable: true,
    comment:
      'Referência a identificador do time perdedor relacionada à tabela appointment_result.',
  })
  loserTeamId!: string | null;

  @Column({
    name: 'winner_score',
    type: 'integer',
    nullable: true,
    comment: 'Pontuação do vencedor de appointment_result.',
  })
  winnerScore!: number | null;

  @Column({
    name: 'loser_score',
    type: 'integer',
    nullable: true,
    comment: 'Pontuação do perdedor de appointment_result.',
  })
  loserScore!: number | null;

  @Column({
    name: 'notes',
    type: 'text',
    nullable: true,
    comment: 'Observações de appointment_result.',
  })
  notes!: string | null;

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

  @ManyToOne('Appointment', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'appointment_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'appointment_result_appointment_id_fkey',
  })
  appointment!: Appointment;

  @ManyToOne('Team', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'winner_team_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'appointment_result_winner_team_id_fkey',
  })
  winnerTeam!: Team | null;

  @ManyToOne('Team', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'loser_team_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'appointment_result_loser_team_id_fkey',
  })
  loserTeam!: Team | null;
}
