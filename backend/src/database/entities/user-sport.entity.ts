import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import type { Sport } from './sport.entity.js';
import type { User } from './users.entity.js';

@Entity({
  name: 'user_sport',
  schema: 'public',
  comment: 'Esportes preferidos associados a cada usuário.',
})
@Index('user_sport_sport_id_index', ['sportId'])
export class UserSport {
  @PrimaryColumn({
    name: 'user_id',
    type: 'uuid',
    nullable: false,
    comment: 'Usuário que declarou a preferência pelo esporte.',
    primaryKeyConstraintName: 'user_sport_pkey',
  })
  userId!: string;

  @PrimaryColumn({
    name: 'sport_id',
    type: 'bigint',
    nullable: false,
    comment: 'Esporte preferido pelo usuário.',
    primaryKeyConstraintName: 'user_sport_pkey',
  })
  sportId!: string;

  @ManyToOne('User', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'user_sport_user_id_fkey',
  })
  user!: User;

  @ManyToOne('Sport', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'sport_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'user_sport_sport_id_fkey',
  })
  sport!: Sport;
}
