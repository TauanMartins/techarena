import type { Point } from 'geojson';
import {
  Check,
  Column,
  Entity,
  ForeignKey,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Arena } from './arena.entity.js';
import type { Schedule } from './schedule.entity.js';
import type { Sport } from './sport.entity.js';
import type { User } from './users.entity.js';

@Entity({ name: 'appointment', schema: 'public' })
@Check(
  'appointment_status_check',
  "status IN ('scheduled', 'in_progress', 'finished', 'canceled')",
)
@Index('appointment_organizer_id_index', ['organizerId'])
@ForeignKey('SportArena', ['sportId', 'arenaId'], ['sportId', 'arenaId'], {
  name: 'appointment_sport_arena_fkey',
})
@Index('appointment_active_arena_slot_unique', { synchronize: false })
@Check(
  'appointment_booking_fields_check',
  '(arena_id IS NULL AND sport_id IS NULL AND schedule_id IS NULL) OR (arena_id IS NOT NULL AND sport_id IS NOT NULL AND schedule_id IS NOT NULL)',
)
export class Appointment {
  @Column({
    name: 'arena_id',
    type: 'bigint',
    nullable: true,
    comment:
      'Arena reservada; nulo em agendamentos legados sem vínculo conhecido.',
  })
  arenaId!: string | null;
  @Column({
    name: 'sport_id',
    type: 'bigint',
    nullable: true,
    comment: 'Modalidade vinculada à arena reservada.',
  })
  sportId!: string | null;
  @Column({
    name: 'schedule_id',
    type: 'bigint',
    nullable: true,
    comment: 'Horário de referência usado para compor scheduled_at em UTC.',
  })
  scheduleId!: string | null;
  @ManyToOne('Arena', { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({
    name: 'arena_id',
    foreignKeyConstraintName: 'appointment_arena_id_fkey',
  })
  arena!: Arena | null;
  @ManyToOne('Sport', { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({
    name: 'sport_id',
    foreignKeyConstraintName: 'appointment_sport_id_fkey',
  })
  sport!: Sport | null;
  @ManyToOne('Schedule', { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({
    name: 'schedule_id',
    foreignKeyConstraintName: 'appointment_schedule_id_fkey',
  })
  schedule!: Schedule | null;

  @PrimaryGeneratedColumn('identity', {
    name: 'id',
    type: 'bigint',
    comment: 'Identificador único do registro da tabela appointment.',
    primaryKeyConstraintName: 'appointment_pkey',
  })
  id!: string;

  @Column({
    name: 'organizer_id',
    type: 'uuid',
    nullable: false,
    comment:
      'Referência a identificador do usuário organizador relacionada à tabela appointment.',
  })
  organizerId!: string;

  @Column({
    name: 'title',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Título de appointment.',
  })
  title!: string;

  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
    comment: 'Descrição de appointment.',
  })
  description!: string | null;

  @Column({
    name: 'scheduled_at',
    type: 'timestamptz',
    nullable: false,
    comment: 'Data e hora agendadas de appointment.',
  })
  scheduledAt!: Date;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Estado atual do registro de appointment.',
    default: 'scheduled',
  })
  status!: string;

  @Column({
    name: 'location',
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 0,
    nullable: true,
    comment: 'Localização geográfica de appointment.',
  })
  location!: Point | null;

  @Column({
    name: 'max_players',
    type: 'integer',
    nullable: true,
    comment: 'Limite de participantes de appointment.',
  })
  maxPlayers!: number | null;

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

  @Column({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Data e hora da exclusão lógica do registro.',
  })
  deletedAt!: Date | null;

  @ManyToOne('User', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'organizer_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'appointment_organizer_id_fkey',
  })
  organizer!: User;
}
