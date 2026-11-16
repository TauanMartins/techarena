import type { Page, PageRequest } from '../../../common/domain/pagination.js';
import type {
  TeamQuery,
  TeamInput,
  TeamView,
  TeamMemberView,
  MembershipRequestView,
} from '../domain/team.js';
export const TEAMS_REPOSITORY = Symbol('TEAMS_REPOSITORY');
export interface MembershipRecord {
  id: string;
  teamId: string;
  userId: string;
  createdBy: string;
  kind: 'invitation' | 'request';
  status: 'pending' | 'accepted' | 'declined';
}
export interface TeamTransaction {
  lockTeam(id: string): Promise<TeamView | null>;
  isCaptain(actor: string, teamId: string): Promise<boolean>;
  userExists(id: string): Promise<boolean>;
  isMember(userId: string, teamId: string): Promise<boolean>;
  pending(teamId: string, userId: string): Promise<MembershipRecord | null>;
  request(id: string): Promise<MembershipRecord | null>;
  createTeam(input: TeamInput): Promise<TeamView>;
  updateTeam(id: string, input: TeamInput): Promise<TeamView>;
  addMember(
    teamId: string,
    userId: string,
    role: 'captain' | 'member',
  ): Promise<void>;
  createRequest(input: Omit<MembershipRecord, 'id'>): Promise<string>;
  setRequestStatus(id: string, status: 'accepted' | 'declined'): Promise<void>;
  presentRequest(id: string): Promise<MembershipRequestView>;
}
export interface TeamsRepository {
  list(query: TeamQuery): Promise<Page<TeamView>>;
  exists(name: string): Promise<boolean>;
  transaction<T>(work: (store: TeamTransaction) => Promise<T>): Promise<T>;
  requests(
    actor: string,
    query: PageRequest,
    teamId?: string,
  ): Promise<Page<MembershipRequestView>>;
  members(teamId: string, query: PageRequest): Promise<Page<TeamMemberView>>;
}
