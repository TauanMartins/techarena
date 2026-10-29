import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import { useAuth } from '../auth/AuthProvider';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeading,
} from '../components/Feedback';
import { api } from '../shared/api';
import type {
  LeagueArena,
  LeagueDetails,
  LeagueMatch,
  LeagueSummary,
  Schedule,
  Sport,
  TeamMembership,
} from '../shared/types';

function localDate() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function LeaguePage() {
  const { session } = useAuth();
  const token = session!.access_token;
  const [leagues, setLeagues] = useState<LeagueSummary[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [myTeams, setMyTeams] = useState<TeamMembership[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [details, setDetails] = useState<LeagueDetails | null>(null);
  const [leagueArenas, setLeagueArenas] = useState<LeagueArena[]>([]);
  const [availability, setAvailability] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [teamId, setTeamId] = useState('');
  const [matchDate, setMatchDate] = useState(localDate);
  const [arenaId, setArenaId] = useState('');
  const [scoreInputs, setScoreInputs] = useState<
    Record<string, { home: string; away: string }>
  >({});
  const detailsRequest = useRef(0);

  const loadCatalog = useCallback(async () => {
    try {
      const [leaguePage, sportPage, teamPage] = await Promise.all([
        api.listLeagues(token),
        api.getSports(token),
        api.listMyTeams(token),
      ]);
      setLeagues(leaguePage.items);
      setSports(sportPage.items);
      setMyTeams(teamPage.items);
      if (leaguePage.items.length === 0) setDetails(null);
      setSelectedId((current) =>
        leaguePage.items.some((league) => league.id === current)
          ? current
          : (leaguePage.items[0]?.id ?? ''),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível carregar as ligas.',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const loadDetails = useCallback(
    async (leagueId: string) => {
      if (!leagueId) return;
      const requestId = ++detailsRequest.current;
      try {
        const [leagueDetails, arenaPage] = await Promise.all([
          api.getLeague(token, leagueId),
          api.getLeagueArenas(token, leagueId),
        ]);
        if (requestId !== detailsRequest.current) return;
        setDetails(leagueDetails);
        setLeagueArenas(arenaPage.items);
        setArenaId((current) =>
          arenaPage.items.some((arena) => arena.id === current)
            ? current
            : (arenaPage.items[0]?.id ?? ''),
        );
        setTeamId('');
      } catch (cause) {
        if (requestId === detailsRequest.current)
          setError(
            cause instanceof Error
              ? cause.message
              : 'Não foi possível carregar os detalhes da liga.',
          );
      } finally {
        if (requestId === detailsRequest.current) setLoadingDetails(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void loadDetails(selectedId);
    return () => {
      detailsRequest.current += 1;
    };
  }, [loadDetails, selectedId]);

  useEffect(() => {
    if (!selectedId || !arenaId || !matchDate) {
      return;
    }
    let active = true;
    void api
      .getLeagueAvailability(token, selectedId, arenaId, matchDate)
      .then((response) => {
        if (active) setAvailability(response.items);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : 'Não foi possível consultar os horários.',
          );
      });
    return () => {
      active = false;
    };
  }, [arenaId, matchDate, selectedId, token]);

  const eligibleTeams = myTeams.filter(
    (team) =>
      team.role === 'captain' &&
      !details?.teams.some((registered) => registered.id === team.id),
  );

  async function refreshSelectedLeague() {
    setLoadingDetails(true);
    await Promise.all([loadCatalog(), loadDetails(selectedId)]);
  }

  async function createLeague(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const description = String(data.get('description') ?? '').trim();
    const sportId = String(data.get('sportId') ?? '');
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const league = await api.createLeague(token, {
        name,
        description: description || undefined,
        sportId,
      });
      setShowCreate(false);
      setLoadingDetails(true);
      setDetails(null);
      setSelectedId(league.id);
      setNotice('Liga criada. Inscreva equipes e organize as partidas.');
      await loadCatalog();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível criar a liga.',
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
      setNotice('Equipe inscrita na liga.');
      await refreshSelectedLeague();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível inscrever a equipe.',
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
      setNotice('Equipe removida da liga.');
      await refreshSelectedLeague();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível remover a equipe.',
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
        homeTeamId: String(data.get('homeTeamId') ?? ''),
        awayTeamId: String(data.get('awayTeamId') ?? ''),
        arenaId,
        scheduleId: String(data.get('scheduleId') ?? ''),
        date: matchDate,
      });
      setNotice('Partida agendada.');
      await refreshSelectedLeague();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível agendar a partida.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveResult(match: LeagueMatch) {
    if (!details) return;
    const scores = scoreInputs[match.id];
    const homeScore = Number(scores?.home);
    const awayScore = Number(scores?.away);
    if (
      scores?.home === '' ||
      scores?.away === '' ||
      !Number.isInteger(homeScore) ||
      !Number.isInteger(awayScore) ||
      homeScore < 0 ||
      awayScore < 0
    ) {
      setError('Informe placares inteiros e não negativos para registrar o resultado.');
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api.recordLeagueResult(token, details.league.id, match.id, {
        homeScore,
        awayScore,
      });
      setNotice('Resultado registrado e classificação atualizada.');
      await refreshSelectedLeague();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível registrar o resultado.',
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
            {showCreate ? 'Fechar' : 'Criar liga'}
          </Button>
        }
      />
      {error && <ErrorState message={error} />}
      {notice && (
        <Alert variant="success" dismissible onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      {showCreate && (
        <Card className="content-card mb-4">
          <Card.Body>
            <h2 className="h4">Nova liga</h2>
            <Form onSubmit={createLeague}>
              <div className="row g-3">
                <Form.Group className="col-md-5" controlId="league-name">
                  <Form.Label>Nome</Form.Label>
                  <Form.Control name="name" required maxLength={45} />
                </Form.Group>
                <Form.Group className="col-md-4" controlId="league-sport">
                  <Form.Label>Modalidade</Form.Label>
                  <Form.Select name="sportId" required defaultValue="">
                    <option value="" disabled>
                      Selecione o esporte
                    </option>
                    {sports.map((sport) => (
                      <option key={sport.id} value={sport.id}>
                        {sport.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="col-md-3" controlId="league-description">
                  <Form.Label>Descrição</Form.Label>
                  <Form.Control
                    name="description"
                    maxLength={500}
                    placeholder="Opcional"
                  />
                </Form.Group>
              </div>
              <Button className="mt-3" type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Criar liga'}
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
                  className={`content-card ${selectedId === league.id ? 'border-primary' : ''}`}
                >
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <h3 className="h5 mb-1">{league.name}</h3>
                        <div className="text-secondary">
                          {league.sportName ?? 'Modalidade não definida'}
                        </div>
                      </div>
                      {league.isOwner && <Badge bg="primary">Organizador</Badge>}
                    </div>
                    <p className="small text-secondary mt-2 mb-2">
                      {league.teamCount} equipes · {league.completedMatchCount}/
                      {league.matchCount} partidas concluídas
                    </p>
                    <Button
                      variant={selectedId === league.id ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => {
                        if (selectedId === league.id) return;
                        setLoadingDetails(true);
                        setDetails(null);
                        setSelectedId(league.id);
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
                          {details.league.sportName ?? 'COMPETIÇÃO'}
                        </span>
                        <h2 className="h3">{details.league.name}</h2>
                        <p className="mb-1">
                          {details.league.description || 'Sem descrição.'}
                        </p>
                        <span className="text-secondary">
                          Organizada por {details.league.ownerName ?? 'membro da comunidade'}
                        </span>
                      </div>
                      <Badge bg="secondary">{details.teams.length} equipes</Badge>
                    </div>
                  </Card.Body>
                </Card>

                <Card className="content-card mb-4">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                      <h3 className="h4 mb-0">Equipes inscritas</h3>
                    </div>
                    {details.teams.length === 0 ? (
                      <p className="text-secondary">Ainda não há equipes inscritas.</p>
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
                                {team.captainName && (
                                  <span className="text-secondary ms-2">
                                    Capitão: {team.captainName}
                                  </span>
                                )}
                              </span>
                              {canRemove && (
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
                    {eligibleTeams.length > 0 && (
                      <Form onSubmit={registerTeam} className="d-flex gap-2">
                        <Form.Select
                          aria-label="Equipe para inscrever"
                          value={teamId}
                          onChange={(event) => setTeamId(event.target.value)}
                          required
                        >
                          <option value="">Selecione uma equipe que você lidera</option>
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
                  </Card.Body>
                </Card>

                {details.league.isOwner && details.teams.length >= 2 && (
                  <Card className="content-card mb-4">
                    <Card.Body>
                      <h3 className="h4">Agendar partida</h3>
                      {leagueArenas.length === 0 ? (
                        <p className="text-secondary mb-0">
                          Ainda não há arenas de liga disponíveis para esta modalidade.
                        </p>
                      ) : (
                        <Form onSubmit={scheduleMatch}>
                          <div className="row g-3">
                            <Form.Group className="col-md-6" controlId="league-home-team">
                              <Form.Label>Equipe da casa</Form.Label>
                              <Form.Select name="homeTeamId" required defaultValue="">
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
                            <Form.Group className="col-md-6" controlId="league-away-team">
                              <Form.Label>Equipe visitante</Form.Label>
                              <Form.Select name="awayTeamId" required defaultValue="">
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
                            <Form.Group className="col-md-4" controlId="league-match-date">
                              <Form.Label>Data</Form.Label>
                              <Form.Control
                                type="date"
                                min={localDate()}
                                value={matchDate}
                                onChange={(event) => {
                                  setAvailability([]);
                                  setMatchDate(event.target.value);
                                }}
                                required
                              />
                            </Form.Group>
                            <Form.Group className="col-md-4" controlId="league-match-arena">
                              <Form.Label>Arena</Form.Label>
                              <Form.Select
                                value={arenaId}
                                onChange={(event) => {
                                  setAvailability([]);
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
                            <Form.Group className="col-md-4" controlId="league-match-time">
                              <Form.Label>Horário disponível</Form.Label>
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
                          </div>
                          {availability.length === 0 && (
                            <p className="text-secondary mt-2 mb-0">
                              Não há horários disponíveis para a data e arena escolhidas.
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
                            scores={scoreInputs[match.id] ?? { home: '', away: '' }}
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
                                <td>{standing.played}</td>
                                <td>{standing.wins}</td>
                                <td>{standing.draws}</td>
                                <td>{standing.losses}</td>
                                <td>{standing.points}</td>
                                <td>{standing.scoreFor - standing.scoreAgainst}</td>
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
  scores,
  saving,
  onScoreChange,
  onSaveResult,
}: {
  match: LeagueMatch;
  canRecordResult: boolean;
  scores: { home: string; away: string };
  saving: boolean;
  onScoreChange: (side: 'home' | 'away', value: string) => void;
  onSaveResult: () => void;
}) {
  const isFinished = match.status === 'finished';
  const isCanceled = match.status === 'canceled';
  const canSubmitScore =
    canRecordResult &&
    !match.result &&
    match.resultAllowed &&
    !isCanceled;
  const statusLabel = isFinished
    ? 'Concluída'
    : isCanceled
      ? 'Cancelada'
      : canSubmitScore
        ? 'Resultado pendente'
        : match.status === 'in_progress'
          ? 'Em andamento'
          : 'Agendada';
  return (
    <Card>
      <Card.Body>
        <div className="d-flex justify-content-between gap-3">
          <div>
            <div className="fw-semibold">
              {match.homeTeam.name} <span className="text-secondary">x</span>{' '}
              {match.awayTeam.name}
            </div>
            <div className="small text-secondary">
              {new Date(match.scheduledAt).toLocaleString('pt-BR')}
              {match.arenaAddress ? ` · ${match.arenaAddress}` : ''}
            </div>
          </div>
          <Badge
            bg={
              isFinished
                ? 'success'
                : isCanceled
                  ? 'danger'
                  : canSubmitScore
                    ? 'warning'
                    : 'secondary'
            }
          >
            {statusLabel}
          </Badge>
        </div>
        {match.result ? (
          <p className="mt-2 mb-0 fw-semibold">
            Placar: {match.result.homeScore} x {match.result.awayScore}
          </p>
        ) : canSubmitScore ? (
          <div className="d-flex align-items-end gap-2 mt-3">
            <Form.Group controlId={`home-score-${match.id}`}>
              <Form.Label className="small">{match.homeTeam.name}</Form.Label>
              <Form.Control
                type="number"
                min={0}
                step={1}
                aria-label={`Placar de ${match.homeTeam.name}`}
                value={scores.home}
                onChange={(event) => onScoreChange('home', event.target.value)}
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
                onChange={(event) => onScoreChange('away', event.target.value)}
              />
            </Form.Group>
            <Button disabled={saving} onClick={onSaveResult}>
              Registrar resultado
            </Button>
          </div>
        ) : null}
      </Card.Body>
    </Card>
  );
}

export { LeaguePage };
