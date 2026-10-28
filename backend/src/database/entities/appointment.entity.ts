import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { User } from './users.entity.js';
import type { Point } from 'geojson';

@Entity({ name: 'appointment', schema: 'public' })
@Check(
  'appointment_status_check',
  "status IN ('scheduled', 'in_progress', 'finished', 'canceled')",
)
@Index('appointment_organizer_id_index', ['organizerId'])
export class Appointment {
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
    type: 'timestamp',
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
