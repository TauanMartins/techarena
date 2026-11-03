import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { leaguesApi } from "../api/leagues.api";
import { useLeaguesData } from "./useLeaguesData";
import { queryKeys } from "../../../lib/query-client";
import { leagueCreateFormSchema, leagueScoreSchema, leagueUpdateFormSchema } from "../schemas/league.schema";
import { localDate } from "../date";
import type { LeagueMatch, LeagueSummary } from "../types/leagues.types";

type LeagueAction =
  | { kind: "create"; payload: Parameters<typeof leaguesApi.create>[1] }
  | { kind: "update"; leagueId: string; payload: Parameters<typeof leaguesApi.update>[2] }
  | { kind: "status"; leagueId: string; status: "completed" | "canceled" }
  | { kind: "generate"; leagueId: string; nextRound: boolean; payload: { arenaId: string; scheduleId: string; date: string; daysBetweenMatches: number } }
  | { kind: "register" | "invite"; leagueId: string; teamId: string }
  | { kind: "respondInvitation"; invitationId: string; action: "accept" | "decline" }
  | { kind: "remove"; leagueId: string; teamId: string }
  | { kind: "createMatch"; leagueId: string; payload: { homeTeamId: string; awayTeamId: string; arenaId: string; scheduleId: string; date: string } }
  | { kind: "result"; leagueId: string; matchId: string; payload: { homeScore: number; awayScore: number } }
  | { kind: "cancelMatch"; leagueId: string; matchId: string }
  | { kind: "reschedule"; leagueId: string; matchId: string; payload: { homeTeamId: string; awayTeamId: string; arenaId: string; scheduleId: string; date: string } };

export function useLeagueWorkspace(token: string, userId: string) {
  const client = useQueryClient();
  const [selectedLeagueId, setSelectedLeagueId] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [teamSearchPerformed, setTeamSearchPerformed] = useState(false);
  const [submittedTeamSearch, setSubmittedTeamSearch] = useState("");
  const [inviteTeamId, setInviteTeamId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [reschedulingId, setReschedulingId] = useState("");
  const [matchDate, setMatchDate] = useState(localDate);
  const [arenaId, setArenaId] = useState("");
  const [scoreInputs, setScoreInputs] = useState<Record<string, { home: string; away: string }>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const data = useLeaguesData({ token, userId, leagueId: selectedLeagueId, arenaId, date: matchDate, teamSearch: submittedTeamSearch, teamSearchEnabled: teamSearchPerformed });
  const mutation = useMutation({ mutationFn: async (action: LeagueAction) => {
    switch (action.kind) {
      case "create": return leaguesApi.create(token, action.payload);
      case "update": return leaguesApi.update(token, action.leagueId, action.payload);
      case "status": return leaguesApi.setStatus(token, action.leagueId, action.status);
      case "generate": return action.nextRound ? leaguesApi.generateNextRound(token, action.leagueId, action.payload) : leaguesApi.generateFixtures(token, action.leagueId, action.payload);
      case "register": return leaguesApi.registerTeam(token, action.leagueId, action.teamId);
      case "invite": return leaguesApi.inviteTeam(token, action.leagueId, action.teamId);
      case "respondInvitation": return leaguesApi.respondInvitation(token, action.invitationId, action.action);
      case "remove": return leaguesApi.removeTeam(token, action.leagueId, action.teamId);
      case "createMatch": return leaguesApi.createMatch(token, action.leagueId, action.payload);
      case "result": return leaguesApi.recordResult(token, action.leagueId, action.matchId, action.payload);
      case "cancelMatch": return leaguesApi.cancelMatch(token, action.leagueId, action.matchId);
      case "reschedule": return leaguesApi.rescheduleMatch(token, action.leagueId, action.matchId, action.payload);
    }
  }, onSuccess: async () => Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.leagues(userId) }),
    client.invalidateQueries({ queryKey: queryKeys.myTeams(userId) }),
    client.invalidateQueries({ queryKey: queryKeys.leagueInvitations(userId) }),
    selectedLeagueId ? client.invalidateQueries({ queryKey: queryKeys.leagueDetails(userId, selectedLeagueId) }) : Promise.resolve(),
  ]) });
  const leagueId = data.selectedLeagueId;
  async function run<T = unknown>(action: LeagueAction, success: string): Promise<T | undefined> {
    setError(null); setNotice(null);
    try { const result = await mutation.mutateAsync(action); setNotice(success); return result as unknown as T; }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível concluir a operação."); return undefined; }
  }
  async function refresh() {
    await Promise.all([client.invalidateQueries({ queryKey: queryKeys.leagues(userId) }), leagueId ? client.invalidateQueries({ queryKey: queryKeys.leagueDetails(userId, leagueId) }) : Promise.resolve()]);
  }
  async function createLeague(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const parsed = leagueCreateFormSchema.safeParse({ name: form.get("name"), description: form.get("description") ?? "", sportId: form.get("sportId"), tournamentFormat: form.get("tournamentFormat") ?? "round_robin", groupCount: form.get("groupCount") ?? 2, qualifiersPerGroup: form.get("qualifiersPerGroup") ?? 2 });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Confira os dados da liga."); return; }
    const created = await run<LeagueSummary>({ kind: "create", payload: parsed.data }, "Liga criada. Inscreva equipes e organize as partidas.");
    if (created) { setShowCreate(false); setSelectedLeagueId(created.id); await client.invalidateQueries({ queryKey: queryKeys.leagues(userId) }); }
  }
  async function updateLeague(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const details = data.details; if (!details) return;
    const form = new FormData(event.currentTarget);
    const parsed = leagueUpdateFormSchema.safeParse({ name: form.get("name"), description: form.get("description") ?? "", tournamentFormat: form.get("tournamentFormat") ?? details.league.tournamentFormat, groupCount: form.get("groupCount") ?? details.league.groupCount, qualifiersPerGroup: form.get("qualifiersPerGroup") ?? details.league.qualifiersPerGroup });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Confira os dados da liga."); return; }
    const updated = await run({ kind: "update", leagueId: details.league.id, payload: { ...parsed.data, description: parsed.data.description ?? null } }, "Configurações da liga atualizadas."); if (updated) await refresh();
  }
  async function updateStatus(status: "completed" | "canceled") {
    const details = data.details; if (!details) return;
    const prompt = status === "canceled" ? "Cancelar a liga e todas as partidas futuras?" : "Encerrar esta liga? Verifique se todas as partidas foram concluídas.";
    if (!window.confirm(prompt)) return;
    const updated = await run({ kind: "status", leagueId: details.league.id, status }, status === "completed" ? "Liga encerrada." : "Liga cancelada."); if (updated) await refresh();
  }
  async function generateFixtures(event: FormEvent<HTMLFormElement>, nextRound = false) {
    event.preventDefault(); const details = data.details; if (!details) return;
    const form = new FormData(event.currentTarget);
    const generated = await run({ kind: "generate", leagueId: details.league.id, nextRound, payload: { arenaId: data.selectedArenaId, scheduleId: String(form.get("scheduleId") ?? ""), date: matchDate, daysBetweenMatches: Number(form.get("daysBetweenMatches") ?? 1) } }, nextRound ? "Próxima fase agendada." : "Calendário gerado."); if (generated) await refresh();
  }
  async function registerTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!data.details || !teamId) return;
    const registered = await run({ kind: "register", leagueId: data.details.league.id, teamId }, "Equipe inscrita na liga."); if (registered) await refresh();
  }
  function searchTeams(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(null); setSubmittedTeamSearch(teamSearch.trim()); setTeamSearchPerformed(true); setInviteTeamId(""); }
  async function inviteTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!data.details || !inviteTeamId) return;
    const done = await run({ kind: "invite", leagueId: data.details.league.id, teamId: inviteTeamId }, "Convite enviado ao capitão da equipe.");
    if (done) { setTeamSearchPerformed(false); setSubmittedTeamSearch(""); setInviteTeamId(""); await refresh(); }
  }
  async function respondInvitation(invitationId: string, action: "accept" | "decline") {
    const done = await run({ kind: "respondInvitation", invitationId, action }, action === "accept" ? "Convite aceito. A equipe está inscrita na liga." : "Convite recusado."); if (done) await refresh();
  }
  async function removeTeam(teamIdToRemove: string) { if (!data.details) return; const removed = await run({ kind: "remove", leagueId: data.details.league.id, teamId: teamIdToRemove }, "Equipe removida da liga."); if (removed) await refresh(); }
  async function scheduleMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!data.details) return; const form = new FormData(event.currentTarget);
    const created = await run({ kind: "createMatch", leagueId: data.details.league.id, payload: { homeTeamId: String(form.get("homeTeamId") ?? ""), awayTeamId: String(form.get("awayTeamId") ?? ""), arenaId: data.selectedArenaId, scheduleId: String(form.get("scheduleId") ?? ""), date: matchDate } }, "Partida agendada."); if (created) await refresh();
  }
  async function saveResult(match: LeagueMatch) {
    if (!data.details) return; const score = scoreInputs[match.id] ?? { home: match.result ? String(match.result.homeScore) : "", away: match.result ? String(match.result.awayScore) : "" };
    const parsed = leagueScoreSchema.safeParse({ homeScore: score.home, awayScore: score.away });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Informe placares inteiros e não negativos."); return; }
    const saved = await run({ kind: "result", leagueId: data.details.league.id, matchId: match.id, payload: parsed.data }, "Resultado registrado e classificação atualizada."); if (saved) await refresh();
  }
  async function cancelMatch(matchId: string) { if (!data.details || !window.confirm("Cancelar esta partida?")) return; const canceled = await run({ kind: "cancelMatch", leagueId: data.details.league.id, matchId }, "Partida cancelada."); if (canceled) await refresh(); }
  async function rescheduleMatch(event: FormEvent<HTMLFormElement>, match: LeagueMatch) {
    event.preventDefault(); if (!data.details) return; const form = new FormData(event.currentTarget);
    const done = await run({ kind: "reschedule", leagueId: data.details.league.id, matchId: match.id, payload: { homeTeamId: match.homeTeam.id, awayTeamId: match.awayTeam.id, arenaId: data.selectedArenaId, scheduleId: String(form.get("scheduleId") ?? ""), date: matchDate } }, "Partida reagendada.");
    if (done) { setReschedulingId(""); await refresh(); }
  }
  const eligibleTeams = data.myTeams.filter((team) => team.role === "captain" && !data.details?.teams.some((item) => item.id === team.id));
  const invitableTeams = data.teamSearchResults.filter((team) => !data.details?.teams.some((item) => item.id === team.id) && !data.details?.invitations.some((item) => item.teamId === team.id));
  return { data, selectedLeagueId, setSelectedLeagueId, teamSearch, setTeamSearch, teamSearchPerformed, setTeamSearchPerformed, submittedTeamSearch, setSubmittedTeamSearch, inviteTeamId, setInviteTeamId, teamId, setTeamId, showCreate, setShowCreate, reschedulingId, setReschedulingId, matchDate, setMatchDate, arenaId, setArenaId, scoreInputs, setScoreInputs, error: error ?? data.error, notice, setNotice, saving: mutation.isPending, eligibleTeams, invitableTeams, createLeague, updateLeague, updateStatus, generateFixtures, registerTeam, searchTeams, inviteTeam, respondInvitation, removeTeam, scheduleMatch, saveResult, cancelMatch, rescheduleMatch, selectLeague: (id: string) => { setError(null); if (data.selectedLeagueId === id) void client.invalidateQueries({ queryKey: queryKeys.leagueDetails(userId, id) }); setSelectedLeagueId(id); } };
}
