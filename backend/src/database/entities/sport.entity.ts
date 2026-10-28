import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'sport', schema: 'public' })
@Unique('sport_name_key', ['name'])
export class Sport {
  @PrimaryGeneratedColumn('identity', {
    name: 'id',
    type: 'bigint',
    comment: 'Chave primária autoincrementável.',
    primaryKeyConstraintName: 'sport_pkey',
  })
  id!: string;

  @Column({
    name: 'name',
    type: 'varchar',
    length: 150,
    nullable: false,
    comment: 'Nome do esporte.',
  })
  name!: string;

  @Column({
    name: 'default_value_player_numbers',
    type: 'integer',
    nullable: false,
    comment: 'Número padrão de jogadores para o esporte.',
  })
  defaultValuePlayerNumbers!: number;
}
