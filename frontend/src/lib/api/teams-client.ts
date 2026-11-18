import type {
  MembershipRequest,
  Page,
  Team,
  TeamMember,
  TeamMembership,
} from '../../shared/types';
import { apiRequest } from './api-request';
import { queryString } from './query-string';
export const teamsClient = {
  deleteTeam: (token: string, teamId: string) =>
    apiRequest<{ success: boolean }>(`/team/${teamId}`, token, {
      method: 'DELETE',
    }),
  leaveTeam: (token: string, teamId: string) =>
    apiRequest<{ success: boolean }>(`/team/${teamId}/members/me`, token, {
      method: 'DELETE',
    }),
  removeTeamMember: (token: string, teamId: string, userId: string) =>
    apiRequest<{ success: boolean }>(
      `/team/${teamId}/members/${userId}`,
      token,
      { method: 'DELETE' },
    ),
  listTeams: (token: string, search = '', page = 1) =>
    apiRequest<Page<Team>>(
      `/team${queryString({ page, limit: 20, search: search.trim() || undefined })}`,
      token,
    ),
  listMyTeams: (token: string) =>
    apiRequest<Page<TeamMembership>>('/users/me/teams?page=1&limit=50', token),
  teamNameExists: (token: string, name: string) =>
    apiRequest<{ exists: boolean }>(
      `/team/exist${queryString({ name })}`,
      token,
    ),
  updateTeam: (
    token: string,
    teamId: string,
    name: string,
    description: string,
    image: string | null,
  ) =>
    apiRequest<Team>('/team', token, {
      method: 'PUT',
      body: JSON.stringify({
        teamId,
        name,
        description,
        ...(image ? { image } : {}),
      }),
    }),
  createTeam: (token: string, name: string, description?: string) =>
    apiRequest<Team>('/team', token, {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),
  requestToJoinTeam: (token: string, teamId: string) =>
    apiRequest<MembershipRequest>('/users/me/team-requests', token, {
      method: 'POST',
      body: JSON.stringify({ teamId }),
    }),
  inviteToTeam: (token: string, teamId: string, userId: string) =>
    apiRequest<MembershipRequest>('/team/user', token, {
      method: 'POST',
      body: JSON.stringify({ teamId, userId }),
    }),
  decideTeamRequest: (
    token: string,
    teamId: string,
    userId: string,
    action: 'accept' | 'decline',
  ) =>
    apiRequest<MembershipRequest>('/team/user', token, {
      method: 'PUT',
      body: JSON.stringify({ teamId, userId, action }),
    }),
  listTeamRequests: (token: string, teamId: string) =>
    apiRequest<Page<MembershipRequest>>(
      `/team/user${queryString({ teamId, page: 1, limit: 50 })}`,
      token,
    ),
  listTeamMembers: (token: string, teamId: string, page = 1) =>
    apiRequest<Page<TeamMember>>(
      `/team/members${queryString({ teamId, page, limit: 50 })}`,
      token,
    ),
  respondToTeamInvitation: (
    token: string,
    requestId: string,
    action: 'accept' | 'decline',
  ) =>
    apiRequest<MembershipRequest>(
      `/users/me/team-invitations/${requestId}`,
      token,
      {
        method: 'PUT',
        body: JSON.stringify({ action }),
      },
    ),
  listMyTeamRequests: (token: string) =>
    apiRequest<Page<MembershipRequest>>(
      '/users/me/team-requests?page=1&limit=50',
      token,
    ),
};
