import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { Material } from './material.entity.js';
import type { Sport } from './sport.entity.js';

@Entity({ name: 'sport_material', schema: 'public' })
@Unique('unique_sport_material', ['sportId', 'materialId'])
@Index('sport_material_material_id_index', ['materialId'])
export class SportMaterial {
  @PrimaryGeneratedColumn('identity', {
    name: 'id',
    type: 'bigint',
    comment: 'Chave primária autoincrementável.',
    primaryKeyConstraintName: 'sport_material_pkey',
  })
  id!: string;

  @Column({
    name: 'sport_id',
    type: 'bigint',
    nullable: false,
    comment: 'ID do esporte referido.',
  })
  sportId!: string;

  @Column({
    name: 'material_id',
    type: 'bigint',
    nullable: false,
    comment: 'ID do material referido.',
  })
  materialId!: string;

  @Column({
    name: 'related_to_local',
    type: 'boolean',
    nullable: false,
    comment:
      'Material pertence ao local físico (true) ou o jogador providencia (false)?',
  })
  relatedToLocal!: boolean;

  @ManyToOne('Sport', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'sport_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'sport_material_sport_id_fkey',
  })
  sport!: Sport;

  @ManyToOne('Material', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'material_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'sport_material_material_id_fkey',
  })
  material!: Material;
}
