import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import type { Permission } from './permission.entity.js';

@Entity({
  name: 'users',
  schema: 'public',
  comment: 'Perfil do usuário da aplicação.',
})
@Unique('users_email_key', ['email'])
@Unique('users_username_key', ['username'])
export class User {
  @PrimaryColumn({
    name: 'id',
    type: 'uuid',
    nullable: false,
    comment: 'Identificador UUID do usuário.',
    primaryKeyConstraintName: 'users_pkey',
  })
  id!: string;

  @Column({
    name: 'name',
    type: 'varchar',
    length: 150,
    nullable: true,
    comment: 'Nome exibido do usuário.',
  })
  name!: string | null;

  @Column({
    name: 'email',
    type: 'varchar',
    length: 150,
    nullable: true,
    comment: 'Endereço de e-mail do usuário.',
  })
  email!: string | null;

  @Column({
    name: 'username',
    type: 'varchar',
    length: 45,
    nullable: true,
    comment: 'Nome de usuário para acesso.',
  })
  username!: string | null;

  @Column({
    name: 'dt_birth',
    type: 'date',
    nullable: true,
    comment: 'Data de nascimento do usuário.',
  })
  dtBirth!: string | null;

  @Column({
    name: 'gender',
    type: 'char',
    length: 1,
    nullable: true,
    comment: 'Gênero do usuário.',
  })
  gender!: string | null;

  @Column({
    name: 'image',
    type: 'varchar',
    length: 150,
    nullable: true,
    comment: 'URL da foto de perfil do usuário.',
  })
  image!: string | null;

  @Column({
    name: 'permission_id',
    type: 'bigint',
    nullable: true,
    comment: 'Permissão opcional atribuída ao usuário.',
  })
  permissionId!: string | null;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    nullable: false,
    comment: 'Data e hora de criação de user.',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @ManyToOne('Permission', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'permission_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'users_permission_id_fkey',
  })
  permission!: Permission | null;
}
