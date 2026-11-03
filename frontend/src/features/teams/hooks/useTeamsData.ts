import { useQuery, useQueryClient } from "@tanstack/react-query";
import { teamsApi } from "../api/teams.api";
import { queryKeys } from "../../../shared/queryClient";
import type { TeamOverview } from "../components/TeamDetailsModal";

export function useTeamsData({
  token,
  userId,
  catalogSearch,
  selectedTeam,
  inviteSearch,
}: {
  token: string;
  userId: string;
  catalogSearch: string;
  selectedTeam: TeamOverview | null;
  inviteSearch: string;
}) {
  const queryClient = useQueryClient();
  const teamsQuery = useQuery({
    queryKey: queryKeys.teams(userId, catalogSearch),
    queryFn: () => teamsApi.list(token, catalogSearch),
  });
  const myTeamsQuery = useQuery({
    queryKey: queryKeys.myTeams(userId),
    queryFn: () => teamsApi.listMine(token),
  });
  const requestsQuery = useQuery({
    queryKey: queryKeys.teamRequests(userId),
    queryFn: () => teamsApi.listRequests(token),
  });
  const teamDetailsQuery = useQuery({
    queryKey: queryKeys.teamDetails(userId, selectedTeam?.id ?? ""),
    queryFn: async () => {
      const [members, teamRequests] = await Promise.all([
        teamsApi.listMembers(token, selectedTeam!.id),
        selectedTeam?.role === "captain"
          ? teamsApi.listTeamRequests(token, selectedTeam.id)
          : Promise.resolve(null),
      ]);
      return { members: members.items, requests: teamRequests?.items ?? [] };
    },
    enabled: Boolean(selectedTeam),
  });
  const inviteCandidatesQuery = useQuery({
    queryKey: queryKeys.directory(userId, `team:${inviteSearch}`),
    queryFn: () => teamsApi.searchUsers(token, inviteSearch),
    enabled: inviteSearch.length >= 2 && selectedTeam?.role === "captain",
  });
  const queryError = [
    teamsQuery.error,
    myTeamsQuery.error,
    requestsQuery.error,
    teamDetailsQuery.error,
    inviteCandidatesQuery.error,
  ].find((cause): cause is Error => cause instanceof Error);

  return {
    teams: teamsQuery.data?.items ?? [],
    myTeams: myTeamsQuery.data?.items ?? [],
    requests: requestsQuery.data?.items ?? [],
    members: teamDetailsQuery.data?.members ?? [],
    teamRequests: teamDetailsQuery.data?.requests ?? [],
    inviteCandidates: inviteCandidatesQuery.data?.items ?? [],
    isLoading:
      teamsQuery.isPending || myTeamsQuery.isPending || requestsQuery.isPending,
    isLoadingDetails: teamDetailsQuery.isPending,
    error: queryError?.message ?? null,
    invalidateTeamLists: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["teams", userId] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myTeams(userId) }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.teamRequests(userId),
        }),
      ]),
    invalidateTeamDetails: (teamId: string) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.teamDetails(userId, teamId),
      }),
  };
}
