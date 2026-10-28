import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'team', schema: 'public' })
@Index('team_name_normalized_unique', { synchronize: false })
export class Team {
  @PrimaryGeneratedColumn('identity', {
    name: 'id',
    type: 'bigint',
    comment: 'Identificador único para a equipe.',
    primaryKeyConstraintName: 'team_pkey',
  })
  id!: string;

  @Column({
    name: 'name',
    type: 'varchar',
    length: 45,
    nullable: false,
    comment: 'Nome da equipe.',
  })
  name!: string;

  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
    comment: 'Descrição da equipe.',
  })
  description!: string | null;

  @Column({
    name: 'image',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'URL da imagem da equipe.',
  })
  image!: string | null;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    nullable: false,
    comment: 'Data e hora de criação do registro.',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
