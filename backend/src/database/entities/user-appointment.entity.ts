import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import type { Appointment } from './appointment.entity.js';
import type { User } from './users.entity.js';

@Entity({ name: 'user_appointment', schema: 'public' })
@Index('user_appointment_user_id_index', ['userId'])
export class UserAppointment {
  @PrimaryColumn({
    name: 'appointment_id',
    type: 'bigint',
    nullable: false,
    comment: 'ID do compromisso.',
    primaryKeyConstraintName: 'user_appointment_pkey',
  })
  appointmentId!: string;

  @PrimaryColumn({
    name: 'user_id',
    type: 'uuid',
    nullable: false,
    comment: 'ID do usuário participante.',
    primaryKeyConstraintName: 'user_appointment_pkey',
  })
  userId!: string;

  @Column({
    name: 'holder',
    type: 'boolean',
    nullable: false,
    comment:
      'Indica se o participante vai jogar como titular (true) ou reserva (false).',
    default: true,
  })
  holder!: boolean;

  @ManyToOne('Appointment', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'appointment_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'user_appointment_appointment_id_fkey',
  })
  appointment!: Appointment;

  @ManyToOne('User', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'user_appointment_user_id_fkey',
  })
  user!: User;
}
