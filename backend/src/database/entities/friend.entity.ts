import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { User } from './users.entity.js';

@Entity({ name: 'friend', schema: 'public' })
@Check('friend_status_check', "status IN ('pending', 'accepted', 'blocked')")
@Unique('friend_requester_addressee_unique', ['requesterId', 'addresseeId'])
@Check('friend_no_self_relationship', 'requester_id <> addressee_id')
@Index('friend_requester_id_index', ['requesterId'])
@Index('friend_addressee_id_index', ['addresseeId'])
@Index('friend_unique_unordered_pair', { synchronize: false })
export class Friend {
  @PrimaryGeneratedColumn('identity', {
    name: 'id',
    type: 'bigint',
    comment: 'Identificador único do registro da tabela friend.',
    primaryKeyConstraintName: 'friend_pkey',
  })
  id!: string;

  @Column({
    name: 'requester_id',
    type: 'uuid',
    nullable: false,
    comment:
      'Referência a usuário que enviou a solicitação relacionada à tabela friend.',
  })
  requesterId!: string;

  @Column({
    name: 'addressee_id',
    type: 'uuid',
    nullable: false,
    comment:
      'Referência a usuário que recebeu a solicitação relacionada à tabela friend.',
  })
  addresseeId!: string;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Estado atual do registro de friend.',
    default: 'pending',
  })
  status!: string;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Data e hora de criação do registro.',
  })
  createdAt!: Date | null;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Data e hora da última atualização do registro.',
  })
  updatedAt!: Date | null;

  @ManyToOne('User', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'requester_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'friend_requester_id_fkey',
  })
  requester!: User;

  @ManyToOne('User', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'addressee_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'friend_addressee_id_fkey',
  })
  addressee!: User;
}
