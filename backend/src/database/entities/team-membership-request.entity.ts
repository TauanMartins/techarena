import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Team } from './team.entity.js';
import type { User } from './users.entity.js';
@Entity({
  name: 'team_membership_request',
  schema: 'public',
  comment:
    'Convites e solicitações; somente aceitos geram vínculo em user_team.',
})
@Check('team_membership_request_kind_check', "kind IN ('invitation','request')")
@Check(
  'team_membership_request_status_check',
  "status IN ('pending','accepted','declined')",
)
@Index('team_membership_request_pending_unique', { synchronize: false })
@Index('team_membership_request_user_id_index', ['userId'])
export class TeamMembershipRequest {
  @PrimaryGeneratedColumn('identity', {
    type: 'bigint',
    primaryKeyConstraintName: 'team_membership_request_pkey',
  })
  id!: string;
  @Column({ name: 'team_id', type: 'bigint' }) teamId!: string;
  @Column({ name: 'user_id', type: 'uuid' }) userId!: string;
  @Column({ name: 'created_by', type: 'uuid' }) createdBy!: string;
  @Column({ type: 'varchar', length: 10 }) kind!: 'invitation' | 'request';
  @Column({ type: 'varchar', length: 10, default: 'pending' }) status!:
    'pending' | 'accepted' | 'declined';
  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;
  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;
  @ManyToOne('Team', { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'team_id',
    foreignKeyConstraintName: 'team_membership_request_team_id_fkey',
  })
  team!: Team;
  @ManyToOne('User', { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'team_membership_request_user_id_fkey',
  })
  user!: User;
  @ManyToOne('User', { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'created_by',
    foreignKeyConstraintName: 'team_membership_request_created_by_fkey',
  })
  creator!: User;
}
