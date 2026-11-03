import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../shared/api";
import { queryKeys } from "../../../shared/queryClient";

export const teamsApi = {
  list: api.listTeams,
  listMine: api.listMyTeams,
  listRequests: api.listMyTeamRequests,
  listMembers: api.listTeamMembers,
  listTeamRequests: api.listTeamRequests,
  searchUsers: api.searchUsers,
  create: api.createTeam,
  requestToJoin: api.requestToJoinTeam,
  invite: api.inviteToTeam,
  decideRequest: api.decideTeamRequest,
  respondToInvitation: api.respondToTeamInvitation,
};

export function useTeamCatalog(token: string, userId: string, search = "") {
  return useQuery({ queryKey: queryKeys.teams(userId, search), queryFn: () => teamsApi.list(token, search) });
}

export function useMyTeams(token: string, userId: string) {
  return useQuery({ queryKey: queryKeys.myTeams(userId), queryFn: () => teamsApi.listMine(token) });
}

export function useTeamRequests(token: string, userId: string) {
  return useQuery({ queryKey: queryKeys.teamRequests(userId), queryFn: () => teamsApi.listRequests(token) });
}

export function useTeamMembers(token: string, userId: string, teamId: string, enabled = true) {
  return useQuery({ queryKey: queryKeys.teamDetails(userId, teamId), queryFn: () => teamsApi.listMembers(token, teamId), enabled: enabled && Boolean(teamId) });
}

export function useCreateTeam(token: string, userId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ name, description }: { name: string; description?: string }) => teamsApi.create(token, name, description), onSuccess: () => client.invalidateQueries({ queryKey: ["teams", userId] }) });
}
