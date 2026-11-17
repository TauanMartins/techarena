import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
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
  const { session } = useAuth();
  const navigate = useNavigate();
  const page = useLeagueWorkspace(
    session!.access_token,
    session!.user.id,
    '',
    (id) => navigate(`/ligas/${id}`),
  );
  const { data } = page;

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
      {page.notice && (
        <Alert
          variant="success"
          dismissible
          onClose={() => page.setNotice(null)}
        >
          {page.notice}
        </Alert>
      )}
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
      {data.isLoading ? (
        <LoadingState label="Carregando ligas..." />
      ) : data.leagues.length === 0 ? (
        <EmptyState
          icon="bi-trophy"
          title="Nenhuma liga criada"
          description="Crie uma liga para começar a organizar equipes e partidas."
        />
      ) : (
        <LeagueCatalog
          leagues={data.leagues}
          selectedId=""
          onSelect={(id) => navigate(`/ligas/${id}`)}
        />
      )}
    </>
  );
}
