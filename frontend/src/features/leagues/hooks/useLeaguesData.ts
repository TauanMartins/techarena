import { useQuery, useQueryClient } from '@tanstack/react-query';
import { leaguesApi } from '../api/leagues.api';
import { queryKeys } from '../../../lib/query-client';
const EMPTY_ITEMS: never[] = [];

export function useLeaguesData({
  token,
  userId,
  leagueId,
  arenaId,
  date,
  teamSearch,
  teamSearchEnabled,
}: {
  token: string;
  userId: string;
  leagueId: string;
  arenaId: string;
  date: string;
  teamSearch: string;
  teamSearchEnabled: boolean;
}) {
  const queryClient = useQueryClient();
  const leaguesQuery = useQuery({
    queryKey: queryKeys.leagues(userId),
    queryFn: () => leaguesApi.list(token),
  });
  const sportsQuery = useQuery({
    queryKey: queryKeys.sports(userId),
    queryFn: () => leaguesApi.sports(token),
  });
  const myTeamsQuery = useQuery({
    queryKey: queryKeys.myTeams(userId),
    queryFn: () => leaguesApi.teams(token),
  });
  const invitationsQuery = useQuery({
    queryKey: queryKeys.leagueInvitations(userId),
    queryFn: () => leaguesApi.invitations(token),
  });
  const resolvedLeagueId = leagueId || leaguesQuery.data?.items[0]?.id || '';
  const detailsQuery = useQuery({
    queryKey: queryKeys.leagueDetails(userId, resolvedLeagueId),
    queryFn: async () => {
      const [details, arenas] = await Promise.all([
        leaguesApi.detail(token, resolvedLeagueId),
        leaguesApi.arenas(token, resolvedLeagueId),
      ]);
      return { details, arenas: arenas.items };
    },
    enabled: Boolean(resolvedLeagueId),
  });
  const selectedArenaId = detailsQuery.data?.arenas.some(
    (arena) => arena.id === arenaId,
  )
    ? arenaId
    : (detailsQuery.data?.arenas[0]?.id ?? '');
  const availabilityQuery = useQuery({
    queryKey: queryKeys.leagueAvailability(
      userId,
      resolvedLeagueId,
      selectedArenaId,
      date,
    ),
    queryFn: () =>
      leaguesApi.availability(token, resolvedLeagueId, selectedArenaId, date),
    enabled: Boolean(resolvedLeagueId && selectedArenaId && date),
  });
  const teamSearchQuery = useQuery({
    queryKey: queryKeys.leagueTeams(userId, teamSearch),
    queryFn: () => leaguesApi.searchTeams(token, teamSearch),
    enabled: teamSearchEnabled,
  });
  const queryError = [
    leaguesQuery.error,
    sportsQuery.error,
    myTeamsQuery.error,
    invitationsQuery.error,
    detailsQuery.error,
    availabilityQuery.error,
    teamSearchQuery.error,
  ].find((cause): cause is Error => cause instanceof Error);

  return {
    leagues: leaguesQuery.data?.items ?? EMPTY_ITEMS,
    selectedLeagueId: resolvedLeagueId,
    sports: sportsQuery.data?.items ?? EMPTY_ITEMS,
    myTeams: myTeamsQuery.data?.items ?? EMPTY_ITEMS,
    teamInvitations: invitationsQuery.data?.items ?? EMPTY_ITEMS,
    teamSearchResults: teamSearchQuery.data?.items ?? EMPTY_ITEMS,
    details: detailsQuery.data?.details ?? null,
    leagueArenas: detailsQuery.data?.arenas ?? EMPTY_ITEMS,
    selectedArenaId,
    availability: availabilityQuery.data?.items ?? EMPTY_ITEMS,
    isLoading:
      leaguesQuery.isPending ||
      sportsQuery.isPending ||
      myTeamsQuery.isPending ||
      invitationsQuery.isPending,
    isLoadingDetails: detailsQuery.isPending,
    isSearchingTeams: teamSearchQuery.isPending,
    error: queryError?.message ?? null,
    invalidateCatalog: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.leagues(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myTeams(userId) }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.leagueInvitations(userId),
        }),
      ]),
    invalidateDetails: (id: string) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.leagueDetails(userId, id),
      }),
  };
}
