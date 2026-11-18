import { ToastNotice } from '../components/ui/ToastNotice';
import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';
import { useAuthenticatedSession } from '../auth/useAuthenticatedSession';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeading,
} from '../components/ui/Feedback';
import { LeagueCatalog } from '../features/leagues/components/LeagueCatalog';
import { LeagueCreatePanel } from '../features/leagues/components/LeagueCreatePanel';
import { LeagueInvitations } from '../features/leagues/components/LeagueInvitations';
import { useLeagueWorkspace } from '../features/leagues/hooks/useLeagueWorkspace';

export function LeaguePage() {
  const { token, userId } = useAuthenticatedSession();
  const navigate = useNavigate();
  const page = useLeagueWorkspace(token, userId, '', (id) =>
    navigate(`/ligas/${id}`),
  );
  const { data } = page;
  const [showAll, setShowAll] = useState(false);
  const leagues = data.leagues.filter(
    (league) => showAll || ['open', 'active'].includes(league.status),
  );

  return (
    <>
      <PageHeading
        eyebrow="COMPETIÇÃO E COMUNIDADE"
        title="Ligas e torneios"
        description="Crie competições, inscreva equipes, agende partidas e acompanhe a classificação."
        action={
          <Button onClick={() => page.setShowCreate((current) => !current)}>
            <i
              className="bi bi-plus-lg me-2"
              aria-hidden="true"
            />
            {page.showCreate ? 'Fechar' : 'Criar liga'}
          </Button>
        }
      />
      {page.error && <ErrorState message={page.error} />}
      {page.notice && <ToastNotice message={page.notice} />}
      <LeagueInvitations
        invitations={data.teamInvitations}
        saving={page.saving}
        onRespond={(id, action) => void page.respondInvitation(id, action)}
      />
      {page.showCreate && (
        <LeagueCreatePanel
          sports={data.sports}
          saving={page.saving}
          onSubmit={(event) => void page.createLeague(event)}
        />
      )}
      <Form.Group
        className="mb-3"
        controlId="league-status-filter"
      >
        <Form.Label>Exibir ligas</Form.Label>
        <Form.Select
          value={showAll ? 'all' : 'active'}
          onChange={(event) => setShowAll(event.target.value === 'all')}
        >
          <option value="active">Ativas</option>
          <option value="all">Todas (incluindo encerradas e canceladas)</option>
        </Form.Select>
      </Form.Group>
      {data.isLoading ? (
        <LoadingState label="Carregando ligas..." />
      ) : leagues.length === 0 ? (
        <EmptyState
          icon="bi-trophy"
          title="Nenhuma liga criada"
          description="Crie uma liga para começar a organizar equipes e partidas."
        />
      ) : (
        <LeagueCatalog
          leagues={leagues}
          selectedId=""
          onSelect={(id) => navigate(`/ligas/${id}`)}
        />
      )}
    </>
  );
}
