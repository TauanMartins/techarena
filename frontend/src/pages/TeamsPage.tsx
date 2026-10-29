import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { useAuth } from '../auth/AuthProvider';
import { EmptyState, ErrorState, LoadingState, PageHeading } from '../components/Feedback';
import { api } from '../shared/api';
import type { MembershipRequest, Team, TeamMembership } from '../shared/types';

export function TeamsPage() {
  const { session } = useAuth();
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

  const loadTeams = useCallback(async (term: string) => {
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
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as equipes.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void loadTeams(''); }, [loadTeams]);

  async function requestJoin(team: Team) {
    setError(null);
    setNotice(null);
    try {
      await api.requestToJoinTeam(token, team.id);
      setNotice(`Solicitação enviada para ${team.name}.`);
      await loadTeams(search);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível solicitar entrada na equipe.');
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
      setError(cause instanceof Error ? cause.message : 'Não foi possível criar a equipe.');
    } finally {
      setCreating(false);
    }
  }

  async function respondToInvitation(requestId: string, action: 'accept' | 'decline') {
    setError(null);
    setNotice(null);
    try {
      await api.respondToTeamInvitation(token, requestId, action);
      setNotice(action === 'accept' ? 'Convite aceito. A equipe já aparece na sua lista.' : 'Convite recusado.');
      await loadTeams(search);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível responder ao convite.');
    }
  }

  const pendingRequestIds = new Set(requests.filter((request) => request.kind === 'request' && request.status === 'pending').map((request) => request.teamId));
  const invitations = requests.filter((request) => request.kind === 'invitation' && request.status === 'pending');
  const myTeamIds = new Set(myTeams.map((team) => team.id));

  return (
    <>
      <PageHeading
        eyebrow="JOGUE EM EQUIPE"
        title="Equipes"
        description="Descubra grupos, solicite participação ou crie sua própria equipe."
        action={<Button onClick={() => setShowCreate(true)}><i className="bi bi-plus-lg me-2" />Criar equipe</Button>}
      />
      {notice && <div className="inline-notice" role="status"><i className="bi bi-check-circle-fill" />{notice}</div>}
      <Form className="search-bar mb-4" onSubmit={(event) => { event.preventDefault(); void loadTeams(search); }}>
        <i className="bi bi-search" aria-hidden="true" />
        <Form.Control aria-label="Buscar equipes" placeholder="Buscar equipe pelo nome" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Button type="submit" variant="outline-primary">Buscar</Button>
      </Form>
      {error && <ErrorState message={error} />}

      {invitations.length > 0 && (
        <section className="content-section">
          <div className="section-title-row"><div><span className="eyebrow">CONVITES RECEBIDOS</span><h2>Entre para uma equipe</h2></div></div>
          <div className="people-list">
            {invitations.map((invitation) => (
              <div className="person-row" key={invitation.id}>
                <div className="team-mark"><i className="bi bi-people-fill" /></div>
                <div className="person-info"><strong>{invitation.teamName}</strong><span>Você recebeu um convite para esta equipe.</span></div>
                <div className="d-flex gap-2">
                  <Button size="sm" onClick={() => void respondToInvitation(invitation.id, 'accept')}>Aceitar</Button>
                  <Button size="sm" variant="outline-secondary" onClick={() => void respondToInvitation(invitation.id, 'decline')}>Recusar</Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="content-section">
        <div className="section-title-row"><div><span className="eyebrow">SEUS GRUPOS</span><h2>Minhas equipes</h2></div></div>
        {!loading && myTeams.length === 0 && (
          <Card className="content-card mb-4"><Card.Body>Você ainda não faz parte de uma equipe. Explore as opções abaixo para começar.</Card.Body></Card>
        )}
        {myTeams.length > 0 && (
          <div className="row g-3 mb-4">
            {myTeams.map((team) => (
              <div className="col-md-6 col-xl-4" key={team.id}>
                <Card className="team-card h-100"><Card.Body>
                  <div className="team-mark"><i className="bi bi-people-fill" /></div>
                  <span className="team-role">{team.role}</span>
                  <h3>{team.name}</h3>
                  <p>{team.description || 'Equipe TechArena'}</p>
                </Card.Body></Card>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="content-section">
        <div className="section-title-row"><div><span className="eyebrow">COMUNIDADE</span><h2>Encontrar equipes</h2></div></div>
        {loading && <LoadingState label="Carregando equipes..." />}
        {!loading && !error && !teams.length && (
          <EmptyState icon="bi-people" title="Nenhuma equipe encontrada" description="Tente outra busca ou crie uma nova equipe." />
        )}
        {!loading && teams.length > 0 && (
          <div className="row g-3">
            {teams.map((team) => {
              const joined = myTeamIds.has(team.id);
              const requested = pendingRequestIds.has(team.id);
              return (
                <div className="col-md-6 col-xl-4" key={team.id}>
                  <Card className="team-card h-100"><Card.Body>
                    <div className="team-mark"><i className="bi bi-people-fill" /></div>
                    <h3>{team.name}</h3>
                    <p>{team.description || 'Uma equipe pronta para receber novos atletas.'}</p>
                    <Button className="mt-3" variant={joined ? 'outline-success' : 'outline-primary'} disabled={joined || requested} onClick={() => void requestJoin(team)}>
                      {joined ? 'Você já participa' : requested ? 'Solicitação enviada' : 'Solicitar participação'}
                    </Button>
                  </Card.Body></Card>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
        <Modal.Header closeButton><Modal.Title>Criar equipe</Modal.Title></Modal.Header>
        <Form onSubmit={(event) => void createTeam(event)}>
          <Modal.Body>
            <Form.Group className="mb-3"><Form.Label>Nome</Form.Label><Form.Control name="name" required maxLength={45} /></Form.Group>
            <Form.Group><Form.Label>Descrição</Form.Label><Form.Control name="description" as="textarea" rows={3} maxLength={2000} /></Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button type="submit" disabled={creating}>{creating ? 'Criando...' : 'Criar equipe'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
