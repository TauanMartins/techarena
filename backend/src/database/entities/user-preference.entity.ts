import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import type { Preference } from './preference.entity.js';
import type { User } from './users.entity.js';

@Entity({ name: 'user_preference', schema: 'public' })
@Index('user_preference_preference_id_index', ['preferenceId'])
export class UserPreference {
  @PrimaryColumn({
    name: 'user_id',
    type: 'uuid',
    nullable: false,
    comment: 'Referência ao ID do usuário.',
    primaryKeyConstraintName: 'user_preference_pkey',
  })
  userId!: string;

  @PrimaryColumn({
    name: 'preference_id',
    type: 'bigint',
    nullable: false,
    comment: 'Referência ao ID da preferência.',
    primaryKeyConstraintName: 'user_preference_pkey',
  })
  preferenceId!: string;

  @Column({
    name: 'value',
    type: 'varchar',
    length: 45,
    nullable: true,
    comment: 'Valor da preferência do usuário.',
  })
  value!: string | null;

  @ManyToOne('User', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'user_preference_user_id_fkey',
  })
  user!: User;

  @ManyToOne('Preference', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'preference_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'user_preference_preference_id_fkey',
  })
  preference!: Preference;
}
