export type {
  MembershipRequest,
  Team,
  TeamMember,
  TeamMembership,
  UserCard,
} from '../../../shared/types';
import type { Team as TeamModel } from '../../../shared/types';

export type TeamOverview = Pick<
  TeamModel,
  'id' | 'name' | 'description' | 'image'
> & { role?: string };
