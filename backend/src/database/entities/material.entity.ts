import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'material', schema: 'public' })
export class Material {
  @PrimaryGeneratedColumn('identity', {
    name: 'id',
    type: 'bigint',
    comment: 'Chave primária autoincrementável.',
    primaryKeyConstraintName: 'material_pkey',
  })
  id!: string;

  @Column({
    name: 'description',
    type: 'varchar',
    length: 250,
    nullable: false,
    comment: 'Descrição do material relacionado a um esporte.',
  })
  description!: string;
}
