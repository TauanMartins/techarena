import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'schedule', schema: 'public' })
@Unique('schedule_horary_key', ['horary'])
export class Schedule {
  @PrimaryGeneratedColumn('identity', {
    name: 'id',
    type: 'bigint',
    comment: 'Identificador único para cada horário.',
    primaryKeyConstraintName: 'schedule_pkey',
  })
  id!: string;

  @Column({
    name: 'horary',
    type: 'time',
    nullable: false,
    comment: 'Horário genérico.',
  })
  horary!: string;
}
