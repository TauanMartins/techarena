import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Image from 'react-bootstrap/Image';
import Modal from 'react-bootstrap/Modal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeading,
} from '../components/Feedback';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { api } from '../shared/api';
import type {
  MembershipRequest,
  Team,
  TeamMember,
  TeamMembership,
  UserCard,
} from '../shared/types';

type TeamOverview = Pick<Team, 'id' | 'name' | 'description' | 'image'> & {
  role?: string;
};

export function TeamsPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const token = session!.access_token;
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeams, setMyTeams] = useState<TeamMembership[]>([]);
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamOverview | null>(null);
  const [teamRequests, setTeamRequests] = useState<MembershipRequest[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteCandidates, setInviteCandidates] = useState<UserCard[]>([]);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const [loadingTeamDetails, setLoadingTeamDetails] = useState(false);

  const loadTeams = useCallback(
    async (term: string) => {
      setLoading(true);
      setError(null);
      try {
        const [catalog, mine, myRequests] = await Promise.all([
          api.listTeams(token, term),
          api.listMyTeams(token),
          api.listMyTeamRequests(token),
        ]);
        setTeams(catalog.items);
        setMyTeams(mine.items);
        setRequests(myRequests.items);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Não foi possível carregar as equipes.',
        );
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void loadTeams('');
  }, [loadTeams]);

  async function requestJoin(team: Pick<Team, 'id' | 'name'>) {
    setError(null);
    setNotice(null);
    try {
      await api.requestToJoinTeam(token, team.id);
      setNotice(`Solicitação enviada para ${team.name}.`);
      await loadTeams(search);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível solicitar entrada na equipe.',
      );
    }
  }

  async function createTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    setCreating(true);
    setError(null);
    try {
      await api.createTeam(token, name, description || undefined);
      setShowCreate(false);
      setNotice('Equipe criada.');
      await loadTeams(search);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível criar a equipe.',
      );
    } finally {
      setCreating(false);
    }
  }

  async function respondToInvitation(
    requestId: string,
    action: 'accept' | 'decline',
  ) {
    setError(null);
    setNotice(null);
    try {
      await api.respondToTeamInvitation(token, requestId, action);
      setNotice(
        action === 'accept'
          ? 'Convite aceito. A equipe já aparece na sua lista.'
          : 'Convite recusado.',
      );
      await loadTeams(search);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível responder ao convite.',
      );
    }
  }

  async function showTeamDetails(team: TeamOverview | TeamMembership) {
    setSelectedTeam(team);
    setTeamRequests([]);
    setTeamMembers([]);
    setInviteCandidates([]);
    setInviteSearch('');
    setLoadingTeamDetails(true);
    setError(null);
    try {
      const [members, requestsPage] = await Promise.all([
        api.listTeamMembers(token, team.id),
        team.role === 'captain'
          ? api.listTeamRequests(token, team.id)
          : Promise.resolve(null),
      ]);
      setTeamMembers(members.items);
      if (requestsPage) setTeamRequests(requestsPage.items);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível carregar os detalhes da equipe.',
      );
    } finally {
      setLoadingTeamDetails(false);
    }
  }

  async function searchInviteCandidates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inviteSearch.trim().length < 2) {
      setError('Digite pelo menos 2 caracteres para buscar atletas.');
      return;
    }
    setError(null);
    try {
      const page = await api.searchUsers(token, inviteSearch.trim());
      setInviteCandidates(page.items);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível buscar atletas.',
      );
    }
  }

  async function inviteUser(user: UserCard) {
    if (!selectedTeam) return;
    setInvitingUserId(user.id);
    setError(null);
    setNotice(null);
    try {
      await api.inviteToTeam(token, selectedTeam.id, user.id);
      setNotice(
        `Convite enviado para ${user.name ?? user.username ?? 'atleta'}.`,
      );
      const page = await api.listTeamRequests(token, selectedTeam.id);
      setTeamRequests(page.items);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível convidar o atleta.',
      );
    } finally {
      setInvitingUserId(null);
    }
  }

  async function decideTeamRequest(
    request: MembershipRequest,
    action: 'accept' | 'decline',
  ) {
    if (!selectedTeam) return;
    setError(null);
    setNotice(null);
    try {
      await api.decideTeamRequest(
        token,
        selectedTeam.id,
        request.userId,
        action,
      );
      setNotice(
        action === 'accept'
          ? 'Solicitação aceita. O atleta entrou para a equipe.'
          : 'Solicitação recusada.',
      );
      const [requestsPage] = await Promise.all([
        api.listTeamRequests(token, selectedTeam.id),
        loadTeams(search),
      ]);
      setTeamRequests(requestsPage.items);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível responder à solicitação.',
      );
    }
  }

  const pendingRequestIds = new Set(
    requests
      .filter(
        (request) => request.kind === 'request' && request.status === 'pending',
      )
      .map((request) => request.teamId),
  );
  const invitations = requests.filter(
    (request) => request.kind === 'invitation' && request.status === 'pending',
  );
  const myTeamIds = new Set(myTeams.map((team) => team.id));

  return (
    <>
      <PageHeading
        eyebrow="JOGUE EM EQUIPE"
        title="Equipes"
        description="Descubra grupos, solicite participação ou crie sua própria equipe."
        action={
          <Button onClick={() => setShowCreate(true)}>
            <i className="bi bi-plus-lg me-2" />
            Criar equipe
          </Button>
        }
      />
      {notice && (
        <div className="inline-notice" role="status">
          <i className="bi bi-check-circle-fill" />
          {notice}
        </div>
      )}
      <Form
        className="search-bar mb-4"
        onSubmit={(event) => {
          event.preventDefault();
          void loadTeams(search);
        }}
      >
        <i className="bi bi-search" aria-hidden="true" />
        <Form.Control
          aria-label="Buscar equipes"
          placeholder="Buscar equipe pelo nome"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Button type="submit" variant="outline-primary">
          Buscar
        </Button>
      </Form>
      {error && <ErrorState message={error} />}

      {invitations.length > 0 && (
        <section className="content-section">
          <div className="section-title-row">
            <div>
              <span className="eyebrow">CONVITES RECEBIDOS</span>
              <h2>Entre para uma equipe</h2>
            </div>
          </div>
          <div className="people-list">
            {invitations.map((invitation) => (
              <div className="person-row" key={invitation.id}>
                <div className="team-mark">
                  <i className="bi bi-people-fill" />
                </div>
                <div className="person-info">
                  <strong>{invitation.teamName}</strong>
                  <span>Você recebeu um convite para esta equipe.</span>
                </div>
                <div className="d-flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      void respondToInvitation(invitation.id, 'accept')
                    }
                  >
                    Aceitar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() =>
                      void respondToInvitation(invitation.id, 'decline')
                    }
                  >
                    Recusar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="content-section">
        <div className="section-title-row">
          <div>
            <span className="eyebrow">SEUS GRUPOS</span>
            <h2>Minhas equipes</h2>
          </div>
        </div>
        {!loading && myTeams.length === 0 && (
          <Card className="content-card mb-4">
            <Card.Body>
              Você ainda não faz parte de uma equipe. Explore as opções abaixo
              para começar.
            </Card.Body>
          </Card>
        )}
        {myTeams.length > 0 && (
          <div className="row g-3 mb-4">
            {myTeams.map((team) => (
              <div className="col-md-6 col-xl-4" key={team.id}>
                <Card className="team-card h-100">
                  <Card.Body>
                    {team.image ? (
                      <Image
                        className="team-card-image"
                        src={team.image}
                        alt={`Imagem da equipe ${team.name}`}
                      />
                    ) : (
                      <div className="team-mark">
                        <i className="bi bi-people-fill" />
                      </div>
                    )}
                    <span className="team-role">{team.role}</span>
                    <h3>{team.name}</h3>
                    <p>{team.description || 'Equipe TechArena'}</p>
                    <div className="d-flex flex-wrap gap-2 mt-3">
                      <Button
                        variant="outline-secondary"
                        onClick={() => void showTeamDetails(team)}
                      >
                        Detalhes e solicitações
                      </Button>
                      <Button
                        variant="outline-primary"
                        onClick={() => navigate(`/chat/team/${team.id}`)}
                      >
                        Ir para conversa
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="content-section">
        <div className="section-title-row">
          <div>
            <span className="eyebrow">COMUNIDADE</span>
            <h2>Encontrar equipes</h2>
          </div>
        </div>
        {loading && <LoadingState label="Carregando equipes..." />}
        {!loading && !error && !teams.length && (
          <EmptyState
            icon="bi-people"
            title="Nenhuma equipe encontrada"
            description="Tente outra busca ou crie uma nova equipe."
          />
        )}
        {!loading && teams.length > 0 && (
          <div className="row g-3">
            {teams.map((team) => {
              const joined = myTeamIds.has(team.id);
              const requested = pendingRequestIds.has(team.id);
              return (
                <div className="col-md-6 col-xl-4" key={team.id}>
                  <Card className="team-card h-100">
                    <Card.Body>
                      {team.image ? (
                        <Image
                          className="team-card-image"
                          src={team.image}
                          alt={`Imagem da equipe ${team.name}`}
                        />
                      ) : (
                        <div className="team-mark">
                          <i className="bi bi-people-fill" />
                        </div>
                      )}
                      <h3>{team.name}</h3>
                      <p>
                        {team.description ||
                          'Uma equipe pronta para receber novos atletas.'}
                      </p>
                      <div className="d-flex flex-wrap gap-2 mt-3">
                        <Button
                          variant="outline-secondary"
                          onClick={() => void showTeamDetails(team)}
                        >
                          Detalhes
                        </Button>
                        <Button
                          variant={
                            joined ? 'outline-success' : 'outline-primary'
                          }
                          disabled={joined || requested}
                          onClick={() => void requestJoin(team)}
                        >
                          {joined
                            ? 'Você já participa'
                            : requested
                              ? 'Solicitação enviada'
                              : 'Solicitar participação'}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Criar equipe</Modal.Title>
        </Modal.Header>
        <Form onSubmit={(event) => void createTeam(event)}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control name="name" required maxLength={45} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Descrição</Form.Label>
              <Form.Control
                name="description"
                as="textarea"
                rows={3}
                maxLength={2000}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="outline-secondary"
              onClick={() => setShowCreate(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Criando...' : 'Criar equipe'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      <Modal
        show={selectedTeam !== null}
        onHide={() => setSelectedTeam(null)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{selectedTeam?.name ?? 'Equipe'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTeam && (
            <>
              {selectedTeam.image && (
                <Image
                  className="team-detail-image mb-3"
                  src={selectedTeam.image}
                  alt={`Imagem da equipe ${selectedTeam.name}`}
                />
              )}
              <p>
                {selectedTeam.description ||
                  'Esta equipe ainda não tem uma descrição.'}
              </p>
              <p className="text-secondary">
                {selectedTeam.role
                  ? `Seu papel: ${selectedTeam.role}`
                  : 'Explore a equipe e solicite participação para entrar.'}
              </p>
              <hr />
              <h3 className="h6">Membros ({teamMembers.length})</h3>
              {loadingTeamDetails && (
                <LoadingState label="Carregando membros..." />
              )}
              {!loadingTeamDetails && teamMembers.length === 0 && (
                <p className="text-secondary">Nenhum membro encontrado.</p>
              )}
              <div className="people-list mb-3">
                {teamMembers.map((member) => (
                  <div className="person-row" key={member.id}>
                    <ProfileAvatar name={member.name} image={member.image} />
                    <div className="person-info">
                      <strong>{member.name ?? 'Atleta'}</strong>
                      <span>
                        {member.username ? `@${member.username}` : member.role}
                      </span>
                    </div>
                    <span className="team-role">
                      {member.role === 'captain' ? 'Capitão' : 'Membro'}
                    </span>
                  </div>
                ))}
              </div>
              {selectedTeam.role === 'captain' && (
                <>
                  <h3 className="h6">Convidar atletas</h3>
                  <Form
                    className="search-bar mb-3"
                    onSubmit={(event) => void searchInviteCandidates(event)}
                  >
                    <i className="bi bi-search" aria-hidden="true" />
                    <Form.Control
                      aria-label="Buscar atleta para convidar"
                      placeholder="Buscar por nome ou usuário"
                      value={inviteSearch}
                      onChange={(event) => setInviteSearch(event.target.value)}
                    />
                    <Button type="submit" variant="outline-primary">
                      Buscar
                    </Button>
                  </Form>
                  <div className="people-list">
                    {inviteCandidates.map((candidate) => {
                      const alreadyMember = teamMembers.some(
                        (member) => member.id === candidate.id,
                      );
                      const pending = teamRequests.some(
                        (request) =>
                          request.userId === candidate.id &&
                          request.status === 'pending',
                      );
                      return (
                        <div className="person-row" key={candidate.id}>
                          <ProfileAvatar
                            name={candidate.name}
                            image={candidate.image}
                          />
                          <div className="person-info">
                            <strong>{candidate.name ?? 'Atleta'}</strong>
                            <span>
                              {candidate.username
                                ? `@${candidate.username}`
                                : 'TechArena'}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            disabled={
                              alreadyMember ||
                              pending ||
                              invitingUserId === candidate.id
                            }
                            onClick={() => void inviteUser(candidate)}
                          >
                            {alreadyMember
                              ? 'Já participa'
                              : pending
                                ? 'Convite pendente'
                                : invitingUserId === candidate.id
                                  ? 'Convidando...'
                                  : 'Convidar'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  {!!teamRequests.filter(
                    (request) =>
                      request.kind === 'request' &&
                      request.status === 'pending',
                  ).length && (
                    <>
                      <hr />
                      <h3 className="h6">Solicitações para entrar</h3>
                      <div className="people-list">
                        {teamRequests
                          .filter(
                            (request) =>
                              request.kind === 'request' &&
                              request.status === 'pending',
                          )
                          .map((request) => (
                            <div className="person-row" key={request.id}>
                              <div className="person-avatar">
                                {request.userName
                                  ?.slice(0, 1)
                                  .toUpperCase() ?? (
                                  <i className="bi bi-person" />
                                )}
                              </div>
                              <div className="person-info">
                                <strong>{request.userName ?? 'Atleta'}</strong>
                                <span>Solicitou entrar na equipe</span>
                              </div>
                              <div className="d-flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    void decideTeamRequest(request, 'accept')
                                  }
                                >
                                  Aceitar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  onClick={() =>
                                    void decideTeamRequest(request, 'decline')
                                  }
                                >
                                  Recusar
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </>
                  )}
                </>
              )}
              {!selectedTeam.role && (
                <div className="d-flex flex-wrap gap-2">
                  <Button
                    variant={
                      myTeamIds.has(selectedTeam.id)
                        ? 'outline-success'
                        : 'outline-primary'
                    }
                    disabled={
                      myTeamIds.has(selectedTeam.id) ||
                      pendingRequestIds.has(selectedTeam.id)
                    }
                    onClick={() => void requestJoin(selectedTeam)}
                  >
                    {myTeamIds.has(selectedTeam.id)
                      ? 'Você já participa'
                      : pendingRequestIds.has(selectedTeam.id)
                        ? 'Solicitação enviada'
                        : 'Solicitar participação'}
                  </Button>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        {selectedTeam && myTeamIds.has(selectedTeam.id) && (
          <Modal.Footer>
            <Button
              variant="outline-primary"
              onClick={() => navigate(`/chat/team/${selectedTeam.id}`)}
            >
              Ir para conversa
            </Button>
          </Modal.Footer>
        )}
      </Modal>
    </>
  );
}
