import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../shared/api";
import { queryKeys } from "../../../shared/queryClient";

export const leaguesApi = {
  list: api.listLeagues, detail: api.getLeague, arenas: api.getLeagueArenas,
  availability: api.getLeagueAvailability, sports: api.getSports, teams: api.listMyTeams,
  invitations: api.listLeagueTeamInvitations, searchTeams: api.listTeams,
  create: api.createLeague, update: api.updateLeague, setStatus: api.setLeagueStatus,
  generateFixtures: api.generateLeagueFixtures, generateNextRound: api.generateLeagueNextRound,
  registerTeam: api.registerLeagueTeam, inviteTeam: api.inviteLeagueTeam,
  respondInvitation: api.respondToLeagueTeamInvitation, removeTeam: api.removeLeagueTeam,
  createMatch: api.createLeagueMatch, recordResult: api.recordLeagueResult,
  cancelMatch: api.cancelLeagueMatch, rescheduleMatch: api.rescheduleLeagueMatch,
};

export function useLeagueCatalog(token: string, userId: string) {
  return useQuery({ queryKey: queryKeys.leagues(userId), queryFn: () => leaguesApi.list(token) });
}

export function useLeagueDetails(token: string, userId: string, leagueId: string) {
  return useQuery({ queryKey: queryKeys.leagueDetails(userId, leagueId), queryFn: async () => {
    const [details, arenas] = await Promise.all([leaguesApi.detail(token, leagueId), leaguesApi.arenas(token, leagueId)]);
    return { details, arenas: arenas.items };
  }, enabled: Boolean(leagueId) });
}

export function useLeagueAvailability(token: string, userId: string, leagueId: string, arenaId: string, date: string) {
  return useQuery({ queryKey: queryKeys.leagueAvailability(userId, leagueId, arenaId, date), queryFn: () => leaguesApi.availability(token, leagueId, arenaId, date), enabled: Boolean(leagueId && arenaId && date) });
}

export function useLeagueMutation<TInput, TOutput>(token: string, userId: string, mutationFn: (token: string, input: TInput) => Promise<TOutput>) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (input: TInput) => mutationFn(token, input), onSuccess: async () => Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.leagues(userId) }),
    client.invalidateQueries({ queryKey: ["leagueDetails", userId] }),
  ]) });
}
