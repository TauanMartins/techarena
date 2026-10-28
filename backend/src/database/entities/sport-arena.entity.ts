import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { Arena } from './arena.entity.js';
import type { Sport } from './sport.entity.js';

@Entity({ name: 'sport_arena', schema: 'public' })
@Unique('unique_sport_arena', ['sportId', 'arenaId'])
@Index('sport_arena_arena_id_index', ['arenaId'])
export class SportArena {
  @PrimaryGeneratedColumn('identity', {
    name: 'id',
    type: 'bigint',
    comment: 'Chave primária autoincrementável.',
    primaryKeyConstraintName: 'sport_arena_pkey',
  })
  id!: string;

  @Column({
    name: 'sport_id',
    type: 'bigint',
    nullable: false,
    comment: 'Chave estrangeira referenciando a tabela "sport".',
  })
  sportId!: string;

  @Column({
    name: 'arena_id',
    type: 'bigint',
    nullable: false,
    comment: 'Chave estrangeira referenciando a tabela "arena".',
  })
  arenaId!: string;

  @ManyToOne('Sport', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'sport_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'sport_arena_sport_id_fkey',
  })
  sport!: Sport;

  @ManyToOne('Arena', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'arena_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'sport_arena_arena_id_fkey',
  })
  arena!: Arena;
}
