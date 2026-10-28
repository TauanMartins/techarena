import type { Page, PageRequest } from '../../../common/domain/pagination.js';
export interface TeamQuery extends PageRequest {
  search?: string;
}
export interface TeamInput {
  name: string;
  description?: string | null;
  image?: string | null;
}
export interface TeamView {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  createdAt: Date;
}
export interface MembershipRequestView {
  id: string;
  teamId: string;
  teamName: string;
  userId: string;
  userName: string | null;
  createdBy: string;
  kind: 'invitation' | 'request';
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}
export type MembershipDecision = 'accept' | 'decline';
export const TEAMS_REPOSITORY = Symbol('TEAMS_REPOSITORY');
export interface TeamsRepository {
  list(query: TeamQuery): Promise<Page<TeamView>>;
  exists(name: string): Promise<boolean>;
  create(actor: string, input: TeamInput): Promise<TeamView>;
  update(actor: string, id: string, input: TeamInput): Promise<TeamView>;
  invite(
    actor: string,
    teamId: string,
    userId: string,
  ): Promise<MembershipRequestView>;
  decideRequest(
    actor: string,
    teamId: string,
    userId: string,
    decision: MembershipDecision,
  ): Promise<MembershipRequestView>;
  requestJoin(actor: string, teamId: string): Promise<MembershipRequestView>;
  respondInvitation(
    actor: string,
    id: string,
    decision: MembershipDecision,
  ): Promise<MembershipRequestView>;
  requests(
    actor: string,
    query: PageRequest,
    teamId?: string,
  ): Promise<Page<MembershipRequestView>>;
}
