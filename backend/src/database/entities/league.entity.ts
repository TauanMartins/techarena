import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

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
    name: 'image',
    type: 'varchar',
    length: 150,
    nullable: true,
    comment: 'Imagem da liga.',
  })
  image!: string | null;
}
