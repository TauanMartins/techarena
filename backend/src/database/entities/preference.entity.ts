import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'preference', schema: 'public' })
@Unique('preference_desc_preference_key', ['descPreference'])
export class Preference {
  @PrimaryGeneratedColumn('identity', {
    name: 'id',
    type: 'bigint',
    comment: 'Chave primária autoincrementável.',
    primaryKeyConstraintName: 'preference_pkey',
  })
  id!: string;

  @Column({
    name: 'desc_preference',
    type: 'varchar',
    length: 45,
    nullable: false,
    comment: 'Descrição da preferência.',
  })
  descPreference!: string;

  @Column({
    name: 'default_value',
    type: 'varchar',
    length: 45,
    nullable: true,
    comment: 'Valor padrão para a preferência.',
  })
  defaultValue!: string | null;
}
