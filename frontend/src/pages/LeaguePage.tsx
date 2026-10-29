import {
  useState,
  type FormEvent,
} from "react";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/useAuth";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeading,
} from "../components/Feedback";
import { LeagueSettingsFields } from "../features/leagues/LeagueSettingsFields";
import { api } from "../shared/api";
import { queryKeys } from "../shared/queryClient";
import {
  leagueCreateFormSchema,
  leagueScoreSchema,
  leagueUpdateFormSchema,
} from "../shared/validation";
import type {
  LeagueArena,
  LeagueDetails,
  LeagueMatch,
  Schedule,
} from "../shared/types";

function localDate() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

const EMPTY_ITEMS: never[] = [];

function LeaguePage() {
  const { session } = useAuth();
  const token = session!.access_token;
  const userId = session!.user.id;
  const queryClient = useQueryClient();
  const [teamSearch, setTeamSearch] = useState("");
  const [teamSearchPerformed, setTeamSearchPerformed] = useState(false);
  const [submittedTeamSearch, setSubmittedTeamSearch] = useState("");
  const [inviteTeamId, setInviteTeamId] = useState("");
  const [selectedLeagueId, setSelectedLeagueId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [teamId, setTeamId] = useState("");
  const [reschedulingId, setReschedulingId] = useState("");
  const [matchDate, setMatchDate] = useState(localDate);
  const [arenaId, setArenaId] = useState("");
  const [scoreInputs, setScoreInputs] = useState<
    Record<string, { home: string; away: string }>
  >({});
  const leaguesQuery = useQuery({
    queryKey: queryKeys.leagues(userId),
    queryFn: () => api.listLeagues(token),
  });
  const sportsQuery = useQuery({
    queryKey: queryKeys.sports(userId),
    queryFn: () => api.getSports(token),
  });
  const myTeamsQuery = useQuery({
    queryKey: queryKeys.myTeams(userId),
    queryFn: () => api.listMyTeams(token),
  });
  const invitationsQuery = useQuery({
    queryKey: queryKeys.leagueInvitations(userId),
    queryFn: () => api.listLeagueTeamInvitations(token),
  });
  const leagues = leaguesQuery.data?.items ?? EMPTY_ITEMS;
  const sports = sportsQuery.data?.items ?? EMPTY_ITEMS;
  const myTeams = myTeamsQuery.data?.items ?? EMPTY_ITEMS;
  const teamInvitations = invitationsQuery.data?.items ?? EMPTY_ITEMS;
  const selectedId = selectedLeagueId || leagues[0]?.id || "";
  const detailsQuery = useQuery({
    queryKey: queryKeys.leagueDetails(userId, selectedId),
    queryFn: async () => {
      const [leagueDetails, arenas] = await Promise.all([
        api.getLeague(token, selectedId),
        api.getLeagueArenas(token, selectedId),
      ]);
      return { details: leagueDetails, arenas: arenas.items };
    },
    enabled: Boolean(selectedId),
  });
  const details: LeagueDetails | null = detailsQuery.data?.details ?? null;
  const leagueArenas = detailsQuery.data?.arenas ?? EMPTY_ITEMS;
  const selectedArenaId = leagueArenas.some((arena) => arena.id === arenaId)
    ? arenaId
    : (leagueArenas[0]?.id ?? "");
  const availabilityQuery = useQuery({
    queryKey: queryKeys.leagueAvailability(
      userId,
      selectedId,
      selectedArenaId,
      matchDate,
    ),
    queryFn: () =>
      api.getLeagueAvailability(token, selectedId, selectedArenaId, matchDate),
    enabled: Boolean(selectedId && selectedArenaId && matchDate),
  });
  const teamSearchQuery = useQuery({
    queryKey: queryKeys.leagueTeams(userId, submittedTeamSearch),
    queryFn: () => api.listTeams(token, submittedTeamSearch),
    enabled: teamSearchPerformed,
  });
  const teamSearchResults = teamSearchQuery.data?.items ?? EMPTY_ITEMS;
  const availability: Schedule[] = availabilityQuery.data?.items ?? EMPTY_ITEMS;
  const loading =
    leaguesQuery.isPending ||
    sportsQuery.isPending ||
    myTeamsQuery.isPending ||
    invitationsQuery.isPending;
  const loadingDetails = detailsQuery.isPending;
  const queryError = [
    leaguesQuery.error,
    sportsQuery.error,
    myTeamsQuery.error,
    invitationsQuery.error,
    detailsQuery.error,
    availabilityQuery.error,
    teamSearchQuery.error,
  ].find((cause): cause is Error => cause instanceof Error);
  const displayError = error ?? queryError?.message;

  const eligibleTeams = myTeams.filter(
    (team) =>
      team.role === "captain" &&
      !details?.teams.some((registered) => registered.id === team.id),
  );
  const invitableTeams = teamSearchResults.filter(
    (team) =>
      !details?.teams.some((registered) => registered.id === team.id) &&
      !details?.invitations.some((invitation) => invitation.teamId === team.id),
  );

  async function refreshSelectedLeague() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.leagues(userId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.myTeams(userId) }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.leagueInvitations(userId),
      }),
      selectedId
        ? queryClient.invalidateQueries({
            queryKey: queryKeys.leagueDetails(userId, selectedId),
          })
        : Promise.resolve(),
    ]);
  }

  async function createLeague(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = leagueCreateFormSchema.safeParse({
      name: data.get("name"),
      description: data.get("description") ?? "",
      sportId: data.get("sportId"),
      tournamentFormat: data.get("tournamentFormat") ?? "round_robin",
      groupCount: data.get("groupCount") ?? 2,
      qualifiersPerGroup: data.get("qualifiersPerGroup") ?? 2,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Confira os dados da liga.");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const league = await api.createLeague(token, {
        ...parsed.data,
      });
      setShowCreate(false);
      setSelectedLeagueId(league.id);
      setNotice("Liga criada. Inscreva equipes e organize as partidas.");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.leagues(userId),
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível criar a liga.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateLeague(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!details) return;
    const data = new FormData(event.currentTarget);
    const parsed = leagueUpdateFormSchema.safeParse({
      name: data.get("name"),
      description: data.get("description") ?? "",
      tournamentFormat:
        data.get("tournamentFormat") ?? details.league.tournamentFormat,
      groupCount: data.get("groupCount") ?? details.league.groupCount,
      qualifiersPerGroup:
        data.get("qualifiersPerGroup") ?? details.league.qualifiersPerGroup,
    });
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? "Confira os dados da liga.",
      );
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api.updateLeague(token, details.league.id, {
        ...parsed.data,
        description: parsed.data.description ?? null,
      });
      setNotice("Configurações da liga atualizadas.");
      await refreshSelectedLeague();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível atualizar a liga.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateLeagueStatus(status: "completed" | "canceled") {
    if (!details) return;
    const confirmation =
      status === "canceled"
        ? "Cancelar a liga e todas as partidas futuras?"
        : "Encerrar esta liga? Verifique se todas as partidas foram concluídas.";
    if (!window.confirm(confirmation)) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api.setLeagueStatus(token, details.league.id, status);
      setNotice(status === "completed" ? "Liga encerrada." : "Liga cancelada.");
      await refreshSelectedLeague();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível encerrar a liga.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function generateFixtures(
    event: FormEvent<HTMLFormElement>,
    nextRound = false,
  ) {
    event.preventDefault();
    if (!details) return;
    const data = new FormData(event.currentTarget);
    const input = {
      arenaId: selectedArenaId,
      scheduleId: String(data.get("scheduleId") ?? ""),
      date: matchDate,
      daysBetweenMatches: Number(data.get("daysBetweenMatches") ?? 1),
    };
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      if (nextRound)
        await api.generateLeagueNextRound(token, details.league.id, input);
      else await api.generateLeagueFixtures(token, details.league.id, input);
      setNotice(nextRound ? "Próxima fase agendada." : "Calendário gerado.");
      await refreshSelectedLeague();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível gerar o calendário.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function registerTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!details || !teamId) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api.registerLeagueTeam(token, details.league.id, teamId);
      setNotice("Equipe inscrita na liga.");
      await refreshSelectedLeague();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível inscrever a equipe.",
      );
    } finally {
      setSaving(false);
    }
  }

  function searchTeams(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmittedTeamSearch(teamSearch.trim());
    setTeamSearchPerformed(true);
    setInviteTeamId("");
  }

  async function inviteTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!details || !inviteTeamId) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api.inviteLeagueTeam(token, details.league.id, inviteTeamId);
      setNotice("Convite enviado ao capitão da equipe.");
      setTeamSearchPerformed(false);
      setSubmittedTeamSearch("");
      setInviteTeamId("");
      await refreshSelectedLeague();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível convidar a equipe.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function respondToTeamInvitation(
    invitationId: string,
    action: "accept" | "decline",
  ) {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api.respondToLeagueTeamInvitation(token, invitationId, action);
      setNotice(
        action === "accept"
          ? "Convite aceito. A equipe está inscrita na liga."
          : "Convite recusado.",
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.leagueInvitations(userId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.myTeams(userId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.leagueDetails(userId, selectedId),
        }),
      ]);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível responder ao convite.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeTeam(removeId: string) {
    if (!details) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api.removeLeagueTeam(token, details.league.id, removeId);
      setNotice("Equipe removida da liga.");
      await refreshSelectedLeague();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível remover a equipe.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function scheduleMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!details) return;
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api.createLeagueMatch(token, details.league.id, {
        homeTeamId: String(data.get("homeTeamId") ?? ""),
        awayTeamId: String(data.get("awayTeamId") ?? ""),
        arenaId: selectedArenaId,
        scheduleId: String(data.get("scheduleId") ?? ""),
        date: matchDate,
      });
      setNotice("Partida agendada.");
      await refreshSelectedLeague();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível agendar a partida.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveResult(match: LeagueMatch) {
    if (!details) return;
    const scores = scoreInputs[match.id] ?? {
      home: match.result ? String(match.result.homeScore) : "",
      away: match.result ? String(match.result.awayScore) : "",
    };
    const parsedScores = leagueScoreSchema.safeParse({
      homeScore: scores.home,
      awayScore: scores.away,
    });
    if (!parsedScores.success) {
      setError(
        parsedScores.error.issues[0]?.message ??
          "Informe placares inteiros e não negativos.",
      );
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api.recordLeagueResult(token, details.league.id, match.id, {
        ...parsedScores.data,
      });
      setNotice("Resultado registrado e classificação atualizada.");
      await refreshSelectedLeague();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível registrar o resultado.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function cancelMatch(matchId: string) {
    if (!details || !window.confirm("Cancelar esta partida?")) return;
    setSaving(true);
    setError(null);
    try {
      await api.cancelLeagueMatch(token, details.league.id, matchId);
      setNotice("Partida cancelada.");
      await refreshSelectedLeague();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível cancelar a partida.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function rescheduleMatch(
    event: FormEvent<HTMLFormElement>,
    match: LeagueMatch,
  ) {
    event.preventDefault();
    if (!details) return;
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    try {
      await api.rescheduleLeagueMatch(token, details.league.id, match.id, {
        homeTeamId: match.homeTeam.id,
        awayTeamId: match.awayTeam.id,
        arenaId: selectedArenaId,
        scheduleId: String(data.get("scheduleId") ?? ""),
        date: matchDate,
      });
      setReschedulingId("");
      setNotice("Partida reagendada.");
      await refreshSelectedLeague();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível reagendar a partida.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="COMPETIÇÃO E COMUNIDADE"
        title="Ligas e torneios"
        description="Crie competições, inscreva equipes, agende partidas e acompanhe a classificação."
        action={
          <Button onClick={() => setShowCreate((current) => !current)}>
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            {showCreate ? "Fechar" : "Criar liga"}
          </Button>
        }
      />
      {displayError && <ErrorState message={displayError} />}
      {notice && (
        <Alert variant="success" dismissible onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      {teamInvitations.length > 0 && (
        <Card className="content-card mb-4">
          <Card.Body>
            <h2 className="h4">Convites para suas equipes</h2>
            <div className="d-grid gap-2">
              {teamInvitations.map((invitation) => (
                <div
                  className="d-flex flex-wrap justify-content-between align-items-center gap-2 border rounded p-3"
                  key={invitation.id}
                >
                  <span>
                    <strong>{invitation.teamName}</strong> foi convidada para{" "}
                    <strong>{invitation.leagueName}</strong>.
                  </span>
                  <div className="d-flex gap-2">
                    <Button
                      size="sm"
                      disabled={saving}
                      onClick={() =>
                        void respondToTeamInvitation(invitation.id, "accept")
                      }
                    >
                      Aceitar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      disabled={saving}
                      onClick={() =>
                        void respondToTeamInvitation(invitation.id, "decline")
                      }
                    >
                      Recusar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {showCreate && (
        <Card className="content-card mb-4">
          <Card.Body>
            <h2 className="h4">Nova liga</h2>
            <Form onSubmit={createLeague} noValidate>
              <LeagueSettingsFields prefix="league" sports={sports} />
              <Button className="mt-3" type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Criar liga"}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      )}

      {loading ? (
        <LoadingState label="Carregando ligas..." />
      ) : error && leagues.length === 0 ? null : leagues.length === 0 ? (
        <EmptyState
          icon="bi-trophy"
          title="Nenhuma liga criada"
          description="Crie uma liga para começar a organizar equipes e partidas."
        />
      ) : (
        <div className="row g-4">
          <aside className="col-lg-4">
            <h2 className="h4 mb-3">Ligas disponíveis</h2>
            <div className="d-grid gap-2">
              {leagues.map((league) => (
                <Card
                  key={league.id}
                  className={`content-card ${selectedId === league.id ? "border-primary" : ""}`}
                >
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <h3 className="h5 mb-1">{league.name}</h3>
                        <div className="text-secondary">
                          {league.sportName ?? "Modalidade não definida"}
                        </div>
                      </div>
                      {league.isOwner && (
                        <Badge bg="primary">Organizador</Badge>
                      )}
                    </div>
                    <p className="small text-secondary mt-2 mb-2">
                      {league.teamCount} equipes · {league.completedMatchCount}/
                      {league.matchCount} partidas concluídas
                    </p>
                    <div className="small mb-2">
                      {league.status === "open"
                        ? "Inscrições abertas"
                        : league.status === "active"
                          ? "Em andamento"
                          : league.status === "completed"
                            ? "Encerrada"
                            : "Cancelada"}
                    </div>
                    <Button
                      variant={
                        selectedId === league.id ? "primary" : "outline-primary"
                      }
                      size="sm"
                      onClick={() => {
                        setError(null);
                        if (selectedId === league.id) {
                          void queryClient.invalidateQueries({
                            queryKey: queryKeys.leagueDetails(userId, league.id),
                          });
                        }
                        setSelectedLeagueId(league.id);
                      }}
                    >
                      Ver liga
                    </Button>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </aside>

          <section className="col-lg-8" aria-live="polite">
            {loadingDetails ? (
              <LoadingState label="Carregando detalhes da liga..." />
            ) : !details ? (
              error ? null : (
                <EmptyState
                  icon="bi-trophy"
                  title="Selecione uma liga"
                  description="Escolha uma liga para ver equipes, partidas e classificação."
                />
              )
            ) : (
              <>
                <Card className="content-card mb-4">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div>
                        <span className="eyebrow">
                          {details.league.sportName ?? "COMPETIÇÃO"}
                        </span>
                        <h2 className="h3">{details.league.name}</h2>
                        <p className="mb-1">
                          {details.league.description || "Sem descrição."}
                        </p>
                        <span className="text-secondary">
                          Organizada por{" "}
                          {details.league.ownerName ?? "membro da comunidade"}
                        </span>
                        <div className="small text-secondary mt-2">
                          {details.league.tournamentFormat === "round_robin"
                            ? "Pontos corridos · 3 pontos por vitória, 1 por empate"
                            : details.league.tournamentFormat === "knockout"
                              ? "Eliminação simples · mata-mata"
                              : `Grupos + mata-mata · ${details.league.groupCount} grupos · ${details.league.qualifiersPerGroup} classificados por grupo`}
                        </div>
                      </div>
                      <Badge
                        bg={
                          details.league.status === "active"
                            ? "success"
                            : "secondary"
                        }
                      >
                        {details.league.status === "open"
                          ? "Inscrições abertas"
                          : details.league.status === "active"
                            ? "Em andamento"
                            : details.league.status === "completed"
                              ? "Encerrada"
                              : "Cancelada"}
                      </Badge>
                    </div>
                  </Card.Body>
                </Card>

                {details.league.isOwner &&
                  ["open", "active"].includes(details.league.status) && (
                    <Card className="content-card mb-4">
                      <Card.Body>
                        <h3 className="h4">Gerenciar liga</h3>
                        <Form onSubmit={updateLeague} noValidate>
                          <LeagueSettingsFields
                            prefix="edit-league"
                            league={details.league}
                            lockedFormat={details.league.matchCount > 0}
                          />
                          <div className="d-flex flex-wrap gap-2 mt-3">
                            <Button type="submit" disabled={saving}>
                              Salvar configurações
                            </Button>
                            {details.league.status === "active" && (
                              <Button
                                type="button"
                                variant="success"
                                disabled={saving}
                                onClick={() =>
                                  void updateLeagueStatus("completed")
                                }
                              >
                                Encerrar liga
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="outline-danger"
                              disabled={saving}
                              onClick={() =>
                                void updateLeagueStatus("canceled")
                              }
                            >
                              Cancelar liga
                            </Button>
                          </div>
                        </Form>
                      </Card.Body>
                    </Card>
                  )}

                <Card className="content-card mb-4">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                      <h3 className="h4 mb-0">Equipes inscritas</h3>
                    </div>
                    {details.teams.length === 0 ? (
                      <p className="text-secondary">
                        Ainda não há equipes inscritas.
                      </p>
                    ) : (
                      <ul className="list-group mb-3">
                        {details.teams.map((team) => {
                          const canRemove =
                            details.league.isOwner ||
                            details.myCaptainTeamIds.includes(team.id);
                          return (
                            <li
                              className="list-group-item d-flex justify-content-between align-items-center gap-2"
                              key={team.id}
                            >
                              <span>
                                <strong>{team.name}</strong>
                                {team.groupNumber && (
                                  <Badge bg="secondary" className="ms-2">
                                    Grupo {team.groupNumber}
                                  </Badge>
                                )}
                                {team.captainName && (
                                  <span className="text-secondary ms-2">
                                    Capitão: {team.captainName}
                                  </span>
                                )}
                              </span>
                              {canRemove &&
                                details.league.status === "open" && (
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    disabled={saving}
                                    onClick={() => void removeTeam(team.id)}
                                  >
                                    Remover
                                  </Button>
                                )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {details.league.status === "open" &&
                      eligibleTeams.length > 0 && (
                        <Form onSubmit={registerTeam} className="d-flex gap-2">
                          <Form.Select
                            aria-label="Equipe para inscrever"
                            value={teamId}
                            onChange={(event) => setTeamId(event.target.value)}
                            required
                          >
                            <option value="">
                              Selecione uma equipe que você lidera
                            </option>
                            {eligibleTeams.map((team) => (
                              <option key={team.id} value={team.id}>
                                {team.name}
                              </option>
                            ))}
                          </Form.Select>
                          <Button type="submit" disabled={saving || !teamId}>
                            Inscrever
                          </Button>
                        </Form>
                      )}
                    {details.league.isOwner &&
                      details.league.status === "open" && (
                        <div className="border-top pt-3 mt-3">
                          <h4 className="h5">Convidar outra equipe</h4>
                          <Form
                            className="d-flex gap-2 mb-3"
                            onSubmit={searchTeams}
                          >
                            <Form.Control
                              aria-label="Buscar equipe para convidar"
                              placeholder="Nome da equipe"
                              value={teamSearch}
                              onChange={(event) => {
                                setTeamSearch(event.target.value);
                                setTeamSearchPerformed(false);
                              }}
                            />
                            <Button type="submit" variant="outline-primary">
                              Buscar
                            </Button>
                          </Form>
                          {invitableTeams.length > 0 && (
                            <Form
                              className="d-flex gap-2"
                              onSubmit={inviteTeam}
                            >
                              <Form.Select
                                aria-label="Equipe para convidar"
                                value={inviteTeamId}
                                onChange={(event) =>
                                  setInviteTeamId(event.target.value)
                                }
                                required
                              >
                                <option value="">Selecione uma equipe</option>
                                {invitableTeams.map((team) => (
                                  <option key={team.id} value={team.id}>
                                    {team.name}
                                  </option>
                                ))}
                              </Form.Select>
                              <Button
                                type="submit"
                                disabled={saving || !inviteTeamId}
                              >
                                Convidar
                              </Button>
                            </Form>
                          )}
                          {teamSearchQuery.isPending && (
                            <p className="text-secondary mb-0">
                              Buscando equipes...
                            </p>
                          )}
                          {teamSearchPerformed &&
                            !teamSearchQuery.isPending &&
                            invitableTeams.length === 0 && (
                              <p className="text-secondary mb-0">
                                {teamSearchResults.length === 0
                                  ? "Nenhuma equipe encontrada."
                                  : "As equipes encontradas já estão inscritas ou têm convite pendente."}
                              </p>
                            )}
                          {details.invitations.length > 0 && (
                            <div className="mt-3">
                              <span className="small text-secondary">
                                Convites pendentes:
                              </span>
                              <ul className="small mb-0">
                                {details.invitations.map((invitation) => (
                                  <li key={invitation.id}>
                                    {invitation.teamName}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                  </Card.Body>
                </Card>

                {details.league.isOwner &&
                  details.league.status === "open" &&
                  details.teams.length >= 2 &&
                  details.matches.length === 0 && (
                    <Card className="content-card mb-4">
                      <Card.Body>
                        <h3 className="h4">Gerar calendário</h3>
                        {leagueArenas.length === 0 ? (
                          <p className="text-secondary mb-0">
                            Ainda não há arenas disponíveis para esta
                            modalidade.
                          </p>
                        ) : (
                          <Form
                            onSubmit={(event) => void generateFixtures(event)}
                          >
                            <div className="row g-3">
                              <Form.Group
                                className="col-md-4"
                                controlId="fixtures-date"
                              >
                                <Form.Label>
                                  Data da primeira partida
                                </Form.Label>
                                <Form.Control
                                  type="date"
                                  min={localDate()}
                                  value={matchDate}
                                  onChange={(event) => {
                                    setMatchDate(event.target.value);
                                  }}
                                  required
                                />
                              </Form.Group>
                              <Form.Group
                                className="col-md-4"
                                controlId="fixtures-arena"
                              >
                                <Form.Label>Arena</Form.Label>
                                <Form.Select
                                  value={selectedArenaId}
                                  onChange={(event) => {
                                    setArenaId(event.target.value);
                                  }}
                                  required
                                >
                                  {leagueArenas.map((arena) => (
                                    <option key={arena.id} value={arena.id}>
                                      {arena.address}
                                    </option>
                                  ))}
                                </Form.Select>
                              </Form.Group>
                              <Form.Group
                                className="col-md-4"
                                controlId="fixtures-schedule"
                              >
                                <Form.Label>Horário inicial</Form.Label>
                                <Form.Select
                                  name="scheduleId"
                                  required
                                  defaultValue=""
                                >
                                  <option value="" disabled>
                                    Selecione um horário
                                  </option>
                                  {availability.map((schedule) => (
                                    <option
                                      key={schedule.id}
                                      value={schedule.id}
                                    >
                                      {schedule.horary.slice(0, 5)}
                                    </option>
                                  ))}
                                </Form.Select>
                              </Form.Group>
                              <Form.Group
                                className="col-md-4"
                                controlId="fixtures-interval"
                              >
                                <Form.Label>
                                  Intervalo entre partidas (dias)
                                </Form.Label>
                                <Form.Control
                                  name="daysBetweenMatches"
                                  type="number"
                                  min={1}
                                  max={30}
                                  defaultValue={1}
                                  required
                                />
                              </Form.Group>
                            </div>
                            <p className="small text-secondary mt-2">
                              O calendário agenda uma partida por data, no mesmo
                              horário e arena.
                            </p>
                            <Button
                              type="submit"
                              disabled={saving || availability.length === 0}
                            >
                              Gerar calendário
                            </Button>
                          </Form>
                        )}
                      </Card.Body>
                    </Card>
                  )}

                {details.league.isOwner &&
                  details.league.status === "active" &&
                  details.league.tournamentFormat !== "round_robin" && (
                    <Card className="content-card mb-4">
                      <Card.Body>
                        <h3 className="h4">Avançar torneio</h3>
                        <p className="text-secondary">
                          A próxima fase só poderá ser criada após registrar
                          todos os resultados da fase atual.
                        </p>
                        <Form
                          onSubmit={(event) =>
                            void generateFixtures(event, true)
                          }
                        >
                          <div className="row g-3">
                            <Form.Group
                              className="col-md-4"
                              controlId="next-round-date"
                            >
                              <Form.Label>Data da primeira partida</Form.Label>
                              <Form.Control
                                type="date"
                                min={localDate()}
                                value={matchDate}
                                onChange={(event) => {
                                  setMatchDate(event.target.value);
                                }}
                                required
                              />
                            </Form.Group>
                            <Form.Group
                              className="col-md-4"
                              controlId="next-round-arena"
                            >
                              <Form.Label>Arena</Form.Label>
                              <Form.Select
                                value={selectedArenaId}
                                onChange={(event) => {
                                  setArenaId(event.target.value);
                                }}
                                required
                              >
                                {leagueArenas.map((arena) => (
                                  <option key={arena.id} value={arena.id}>
                                    {arena.address}
                                  </option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                            <Form.Group
                              className="col-md-4"
                              controlId="next-round-schedule"
                            >
                              <Form.Label>Horário inicial</Form.Label>
                              <Form.Select
                                name="scheduleId"
                                required
                                defaultValue=""
                              >
                                <option value="" disabled>
                                  Selecione um horário
                                </option>
                                {availability.map((schedule) => (
                                  <option key={schedule.id} value={schedule.id}>
                                    {schedule.horary.slice(0, 5)}
                                  </option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                            <Form.Group
                              className="col-md-4"
                              controlId="next-round-interval"
                            >
                              <Form.Label>
                                Intervalo entre partidas (dias)
                              </Form.Label>
                              <Form.Control
                                name="daysBetweenMatches"
                                type="number"
                                min={1}
                                max={30}
                                defaultValue={1}
                                required
                              />
                            </Form.Group>
                          </div>
                          <Button
                            className="mt-3"
                            type="submit"
                            disabled={saving || availability.length === 0}
                          >
                            Gerar próxima fase
                          </Button>
                        </Form>
                      </Card.Body>
                    </Card>
                  )}

                {details.league.isOwner &&
                  ["open", "active"].includes(details.league.status) &&
                  details.teams.length >= 2 && (
                    <Card className="content-card mb-4">
                      <Card.Body>
                        <h3 className="h4">Agendar partida</h3>
                        {leagueArenas.length === 0 ? (
                          <p className="text-secondary mb-0">
                            Ainda não há arenas disponíveis para esta
                            modalidade.
                          </p>
                        ) : (
                          <Form onSubmit={scheduleMatch}>
                            <div className="row g-3">
                              <Form.Group
                                className="col-md-6"
                                controlId="league-home-team"
                              >
                                <Form.Label>Equipe da casa</Form.Label>
                                <Form.Select
                                  name="homeTeamId"
                                  required
                                  defaultValue=""
                                >
                                  <option value="" disabled>
                                    Selecione
                                  </option>
                                  {details.teams.map((team) => (
                                    <option key={team.id} value={team.id}>
                                      {team.name}
                                    </option>
                                  ))}
                                </Form.Select>
                              </Form.Group>
                              <Form.Group
                                className="col-md-6"
                                controlId="league-away-team"
                              >
                                <Form.Label>Equipe visitante</Form.Label>
                                <Form.Select
                                  name="awayTeamId"
                                  required
                                  defaultValue=""
                                >
                                  <option value="" disabled>
                                    Selecione
                                  </option>
                                  {details.teams.map((team) => (
                                    <option key={team.id} value={team.id}>
                                      {team.name}
                                    </option>
                                  ))}
                                </Form.Select>
                              </Form.Group>
                              <Form.Group
                                className="col-md-4"
                                controlId="league-match-date"
                              >
                                <Form.Label>Data</Form.Label>
                                <Form.Control
                                  type="date"
                                  min={localDate()}
                                  value={matchDate}
                                  onChange={(event) => {
                                    setMatchDate(event.target.value);
                                  }}
                                  required
                                />
                              </Form.Group>
                              <Form.Group
                                className="col-md-4"
                                controlId="league-match-arena"
                              >
                                <Form.Label>Arena</Form.Label>
                                <Form.Select
                                  value={selectedArenaId}
                                  onChange={(event) => {
                                    setArenaId(event.target.value);
                                  }}
                                  required
                                >
                                  {leagueArenas.map((arena) => (
                                    <option key={arena.id} value={arena.id}>
                                      {arena.address}
                                    </option>
                                  ))}
                                </Form.Select>
                              </Form.Group>
                              <Form.Group
                                className="col-md-4"
                                controlId="league-match-time"
                              >
                                <Form.Label>Horário disponível</Form.Label>
                                <Form.Select
                                  name="scheduleId"
                                  required
                                  defaultValue=""
                                >
                                  <option value="" disabled>
                                    Selecione
                                  </option>
                                  {availability.map((schedule) => (
                                    <option
                                      key={schedule.id}
                                      value={schedule.id}
                                    >
                                      {schedule.horary.slice(0, 5)}
                                    </option>
                                  ))}
                                </Form.Select>
                              </Form.Group>
                            </div>
                            {availability.length === 0 && (
                              <p className="text-secondary mt-2 mb-0">
                                Não há horários disponíveis para a data e arena
                                escolhidas.
                              </p>
                            )}
                            <Button
                              className="mt-3"
                              type="submit"
                              disabled={saving || availability.length === 0}
                            >
                              Agendar partida
                            </Button>
                          </Form>
                        )}
                      </Card.Body>
                    </Card>
                  )}

                <Card className="content-card mb-4">
                  <Card.Body>
                    <h3 className="h4">Partidas</h3>
                    {details.matches.length === 0 ? (
                      <p className="text-secondary mb-0">
                        As partidas agendadas para esta liga aparecerão aqui.
                      </p>
                    ) : (
                      <div className="d-grid gap-3">
                        {details.matches.map((match) => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            canRecordResult={details.league.isOwner}
                            canManage={details.league.isOwner}
                            isRescheduling={reschedulingId === match.id}
                            date={matchDate}
                            arenas={leagueArenas}
                            arenaId={selectedArenaId}
                            availability={availability}
                            scores={
                              scoreInputs[match.id] ?? {
                                home: match.result
                                  ? String(match.result.homeScore)
                                  : "",
                                away: match.result
                                  ? String(match.result.awayScore)
                                  : "",
                              }
                            }
                            saving={saving}
                            onScoreChange={(side, value) =>
                              setScoreInputs((current) => ({
                                ...current,
                                [match.id]: {
                                  ...current[match.id],
                                  [side]: value,
                                },
                              }))
                            }
                            onSaveResult={() => void saveResult(match)}
                            onCancel={() => void cancelMatch(match.id)}
                            onToggleReschedule={() =>
                              setReschedulingId((current) =>
                                current === match.id ? "" : match.id,
                              )
                            }
                            onDateChange={(date) => {
                              setMatchDate(date);
                            }}
                            onArenaChange={(id) => {
                              setArenaId(id);
                            }}
                            onReschedule={(event) =>
                              void rescheduleMatch(event, match)
                            }
                          />
                        ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>

                <Card className="content-card">
                  <Card.Body>
                    <h3 className="h4">Classificação</h3>
                    {details.standings.length === 0 ? (
                      <p className="text-secondary mb-0">
                        Inscreva equipes para iniciar a classificação.
                      </p>
                    ) : (
                      <div className="table-responsive">
                        <Table hover className="align-middle mb-0">
                          <thead>
                            <tr>
                              <th scope="col">Equipe</th>
                              {details.league.tournamentFormat ===
                                "groups_knockout" && <th scope="col">Grupo</th>}
                              <th scope="col">J</th>
                              <th scope="col">V</th>
                              <th scope="col">E</th>
                              <th scope="col">D</th>
                              <th scope="col">Pontos</th>
                              <th scope="col">Saldo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {details.standings.map((standing, index) => (
                              <tr key={standing.teamId}>
                                <th scope="row">
                                  {index + 1}. {standing.teamName}
                                </th>
                                {details.league.tournamentFormat ===
                                  "groups_knockout" && (
                                  <td>{standing.groupNumber ?? "—"}</td>
                                )}
                                <td>{standing.played}</td>
                                <td>{standing.wins}</td>
                                <td>{standing.draws}</td>
                                <td>{standing.losses}</td>
                                <td>{standing.points}</td>
                                <td>
                                  {standing.scoreFor - standing.scoreAgainst}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}

function MatchCard({
  match,
  canRecordResult,
  canManage,
  isRescheduling,
  date,
  arenas,
  arenaId,
  availability,
  scores,
  saving,
  onScoreChange,
  onSaveResult,
  onCancel,
  onToggleReschedule,
  onDateChange,
  onArenaChange,
  onReschedule,
}: {
  match: LeagueMatch;
  canRecordResult: boolean;
  canManage: boolean;
  isRescheduling: boolean;
  date: string;
  arenas: LeagueArena[];
  arenaId: string;
  availability: Schedule[];
  scores: { home: string; away: string };
  saving: boolean;
  onScoreChange: (side: "home" | "away", value: string) => void;
  onSaveResult: () => void;
  onCancel: () => void;
  onToggleReschedule: () => void;
  onDateChange: (date: string) => void;
  onArenaChange: (id: string) => void;
  onReschedule: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isFinished = match.status === "finished";
  const isCanceled = match.status === "canceled";
  const canSubmitScore = canRecordResult && match.resultAllowed && !isCanceled;
  const canReschedule =
    canManage &&
    match.status === "scheduled" &&
    new Date(match.scheduledAt) > new Date();
  const statusLabel = isFinished
    ? "Concluída"
    : isCanceled
      ? "Cancelada"
      : canSubmitScore
        ? "Resultado pendente"
        : match.status === "in_progress"
          ? "Em andamento"
          : "Agendada";
  return (
    <Card>
      <Card.Body>
        <div className="d-flex justify-content-between gap-3">
          <div>
            <div className="fw-semibold">
              {match.homeTeam.name} <span className="text-secondary">x</span>{" "}
              {match.awayTeam.name}
            </div>
            <div className="small text-secondary">
              {new Date(match.scheduledAt).toLocaleString("pt-BR")}
              {match.arenaAddress ? ` · ${match.arenaAddress}` : ""}
            </div>
            <div className="small text-secondary">
              {match.phase === "knockout"
                ? `Mata-mata · rodada ${match.roundNumber}`
                : match.phase === "group"
                  ? match.groupNumber
                    ? `Grupos · grupo ${match.groupNumber} · rodada ${match.roundNumber}`
                    : `Pontos corridos · rodada ${match.roundNumber}`
                  : "Partida avulsa"}
            </div>
          </div>
          <Badge
            bg={
              isFinished
                ? "success"
                : isCanceled
                  ? "danger"
                  : canSubmitScore
                    ? "warning"
                    : "secondary"
            }
          >
            {statusLabel}
          </Badge>
        </div>
        {match.result && (
          <p className="mt-2 mb-0 fw-semibold">
            Placar: {match.result.homeScore} x {match.result.awayScore}
          </p>
        )}
        {canSubmitScore ? (
          <div className="d-flex align-items-end gap-2 mt-3">
            <Form.Group controlId={`home-score-${match.id}`}>
              <Form.Label className="small">{match.homeTeam.name}</Form.Label>
              <Form.Control
                type="number"
                min={0}
                step={1}
                aria-label={`Placar de ${match.homeTeam.name}`}
                value={scores.home}
                onChange={(event) => onScoreChange("home", event.target.value)}
              />
            </Form.Group>
            <span className="pb-2">x</span>
            <Form.Group controlId={`away-score-${match.id}`}>
              <Form.Label className="small">{match.awayTeam.name}</Form.Label>
              <Form.Control
                type="number"
                min={0}
                step={1}
                aria-label={`Placar de ${match.awayTeam.name}`}
                value={scores.away}
                onChange={(event) => onScoreChange("away", event.target.value)}
              />
            </Form.Group>
            <Button disabled={saving} onClick={onSaveResult}>
              {match.result ? "Atualizar resultado" : "Registrar resultado"}
            </Button>
          </div>
        ) : null}
        {canReschedule && !isRescheduling && (
          <div className="d-flex gap-2 mt-3">
            <Button
              variant="outline-primary"
              size="sm"
              disabled={saving}
              onClick={onToggleReschedule}
            >
              Reagendar
            </Button>
            {match.phase === "manual" && (
              <Button
                variant="outline-danger"
                size="sm"
                disabled={saving}
                onClick={onCancel}
              >
                Cancelar partida
              </Button>
            )}
          </div>
        )}
        {isRescheduling && (
          <Form className="row g-2 mt-2" onSubmit={onReschedule}>
            <Form.Group
              className="col-md-4"
              controlId={`reschedule-date-${match.id}`}
            >
              <Form.Label className="small">Nova data</Form.Label>
              <Form.Control
                type="date"
                min={localDate()}
                value={date}
                onChange={(event) => onDateChange(event.target.value)}
                required
              />
            </Form.Group>
            <Form.Group
              className="col-md-4"
              controlId={`reschedule-arena-${match.id}`}
            >
              <Form.Label className="small">Arena</Form.Label>
              <Form.Select
                value={arenaId}
                onChange={(event) => onArenaChange(event.target.value)}
                required
              >
                {arenas.map((arena) => (
                  <option key={arena.id} value={arena.id}>
                    {arena.address}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group
              className="col-md-4"
              controlId={`reschedule-time-${match.id}`}
            >
              <Form.Label className="small">Horário disponível</Form.Label>
              <Form.Select name="scheduleId" required defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                {availability.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.horary.slice(0, 5)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <div className="d-flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={saving || availability.length === 0}
              >
                Salvar novo horário
              </Button>
              <Button
                type="button"
                variant="outline-secondary"
                size="sm"
                onClick={onToggleReschedule}
              >
                Voltar
              </Button>
            </div>
          </Form>
        )}
      </Card.Body>
    </Card>
  );
}

export { LeaguePage };
