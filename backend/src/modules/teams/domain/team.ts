import type { PageRequest } from '../../../common/domain/pagination.js';
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
export interface TeamMemberView {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  role: string;
  joinedAt: Date | null;
}
export type MembershipDecision = 'accept' | 'decline';
