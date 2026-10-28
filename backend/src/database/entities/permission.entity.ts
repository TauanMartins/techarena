import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'permission', schema: 'public' })
@Unique('permission_slug_key', ['slug'])
@Unique('permission_symbol_key', ['symbol'])
export class Permission {
  @PrimaryGeneratedColumn('identity', {
    name: 'id',
    type: 'bigint',
    comment: 'Chave primária autoincrementável.',
    primaryKeyConstraintName: 'permission_pkey',
  })
  id!: string;

  @Column({
    name: 'slug',
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Slug identificador da permissão.',
  })
  slug!: string;

  @Column({
    name: 'symbol',
    type: 'char',
    length: 1,
    nullable: false,
    comment: 'Símbolo representativo da permissão.',
  })
  symbol!: string;
}
