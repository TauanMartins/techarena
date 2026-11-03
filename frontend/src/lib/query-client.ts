import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  theme: (userId: string) => ['theme', userId] as const,
  favoriteSports: (userId: string) => ['favoriteSports', userId] as const,
  appointments: (userId: string, params: object) =>
    ['appointments', userId, params] as const,
  myAppointments: (userId: string) => ['myAppointments', userId] as const,
  teams: (userId: string, search: string) =>
    ['teams', userId, search] as const,
  myTeams: (userId: string) => ['myTeams', userId] as const,
  teamRequests: (userId: string) => ['teamRequests', userId] as const,
  teamDetails: (userId: string, teamId: string) =>
    ['teamDetails', userId, teamId] as const,
  community: (userId: string) => ['community', userId] as const,
  directory: (userId: string, search: string) =>
    ['directory', userId, search] as const,
  leagues: (userId: string) => ['leagues', userId] as const,
  leagueDetails: (userId: string, leagueId: string) =>
    ['leagueDetails', userId, leagueId] as const,
  leagueTeams: (userId: string, search: string) =>
    ['leagueTeams', userId, search] as const,
  leagueInvitations: (userId: string) => ['leagueInvitations', userId] as const,
  chatConversations: (userId: string) => ['chatConversations', userId] as const,
  sports: (userId: string) => ['sports', userId] as const,
  arenas: (userId: string) => ['arenas', userId] as const,
  leagueArenas: (userId: string, leagueId: string) =>
    ['leagueArenas', userId, leagueId] as const,
  availability: (userId: string, arenaId: string, sportId: string, date: string) =>
    ['availability', userId, arenaId, sportId, date] as const,
  leagueAvailability: (
    userId: string,
    leagueId: string,
    arenaId: string,
    date: string,
  ) => ['leagueAvailability', userId, leagueId, arenaId, date] as const,
};
