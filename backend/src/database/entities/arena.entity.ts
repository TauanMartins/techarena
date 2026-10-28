import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'arena', schema: 'public' })
export class Arena {
  @PrimaryGeneratedColumn('identity', {
    name: 'id',
    type: 'bigint',
    comment: 'Chave primária autoincrementável.',
    primaryKeyConstraintName: 'arena_pkey',
  })
  id!: string;

  @Column({
    name: 'address',
    type: 'varchar',
    length: 150,
    nullable: false,
    comment: 'Endereço da arena.',
  })
  address!: string;

  @Column({
    name: 'lat',
    type: 'numeric',
    precision: 10,
    scale: 7,
    nullable: false,
    comment: 'Latitude para localização geográfica.',
  })
  lat!: string;

  @Column({
    name: 'longitude',
    type: 'numeric',
    precision: 11,
    scale: 7,
    nullable: false,
    comment: 'Longitude para localização geográfica.',
  })
  longitude!: string;

  @Column({
    name: 'image',
    type: 'varchar',
    length: 150,
    nullable: true,
    comment: 'Caminho da imagem da arena.',
  })
  image!: string | null;

  @Column({
    name: 'is_league_only',
    type: 'boolean',
    nullable: false,
    comment: 'Indica se a arena é exclusiva para ligas.',
    default: false,
  })
  isLeagueOnly!: boolean;
}
