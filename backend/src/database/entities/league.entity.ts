import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { User } from './users.entity.js';
import type { Sport } from './sport.entity.js';

@Entity({ name: 'league', schema: 'public' })
@Unique('league_league_number_key', ['leagueNumber'])
export class League {
  @PrimaryGeneratedColumn('identity', {
    name: 'id',
    type: 'bigint',
    comment: 'ID da liga.',
    primaryKeyConstraintName: 'league_pkey',
  })
  id!: string;

  @Column({
    name: 'name',
    type: 'varchar',
    length: 45,
    nullable: false,
    comment: 'Nome da liga.',
  })
  name!: string;

  @Column({
    name: 'description',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Descrição da liga.',
  })
  description!: string | null;

  @Column({
    name: 'league_number',
    type: 'bigint',
    nullable: false,
    comment: 'Número identificador da liga.',
  })
  leagueNumber!: string;

  @Column({
    name: 'owner_id',
    type: 'uuid',
    nullable: true,
    comment: 'Organizador responsável pela liga.',
  })
  ownerId!: string | null;

  @Column({
    name: 'sport_id',
    type: 'bigint',
    nullable: true,
    comment: 'Modalidade esportiva da liga.',
  })
  sportId!: string | null;

  @Column({
    name: 'created_at',
    type: 'timestamptz',
    nullable: false,
    default: () => 'now()',
    comment: 'Data de criação da liga.',
  })
  createdAt!: Date;

  @Column({
    name: 'image',
    type: 'varchar',
    length: 150,
    nullable: true,
    comment: 'Imagem da liga.',
  })
  image!: string | null;

  @ManyToOne('User', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'owner_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'league_owner_id_fkey',
  })
  owner!: User | null;

  @ManyToOne('Sport', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'sport_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'league_sport_id_fkey',
  })
  sport!: Sport | null;
}
