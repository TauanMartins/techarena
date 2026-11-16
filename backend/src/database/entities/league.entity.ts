import {
  Check,
  Column,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { User } from './users.entity.js';
import type { Sport } from './sport.entity.js';

@Entity({ name: 'league', schema: 'public' })
@Unique('league_league_number_key', ['leagueNumber'])
@Index('league_owner_id_index', ['ownerId'])
@Index('league_sport_id_index', ['sportId'])
@Check(
  'league_tournament_format_check',
  "tournament_format IN ('round_robin', 'knockout', 'groups_knockout')",
)
@Check(
  'league_tournament_status_check',
  "status IN ('open', 'active', 'completed', 'canceled')",
)
@Check('league_group_count_check', 'group_count BETWEEN 2 AND 16')
@Check(
  'league_qualifiers_per_group_check',
  'qualifiers_per_group BETWEEN 1 AND 8',
)
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
  @Generated('increment')
  leagueNumber!: string;

  @Column({
    name: 'owner_id',
    type: 'uuid',
    nullable: true,
  })
  ownerId!: string | null;

  @Column({
    name: 'sport_id',
    type: 'bigint',
    nullable: true,
  })
  sportId!: string | null;

  @Column({
    name: 'created_at',
    type: 'timestamptz',
    nullable: false,
    default: () => 'now()',
  })
  createdAt!: Date;

  @Column({
    name: 'tournament_format',
    type: 'varchar',
    length: 24,
    nullable: false,
    default: 'round_robin',
  })
  tournamentFormat!: 'round_robin' | 'knockout' | 'groups_knockout';

  @Column({
    name: 'status',
    type: 'varchar',
    length: 16,
    nullable: false,
    default: 'open',
  })
  status!: 'open' | 'active' | 'completed' | 'canceled';

  @Column({
    name: 'group_count',
    type: 'integer',
    nullable: false,
    default: 2,
  })
  groupCount!: number;

  @Column({
    name: 'qualifiers_per_group',
    type: 'integer',
    nullable: false,
    default: 2,
  })
  qualifiersPerGroup!: number;

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
