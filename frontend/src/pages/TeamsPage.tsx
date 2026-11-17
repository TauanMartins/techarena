import { useState, type SubmitEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import {
  ErrorState,
  PageHeading,
  LoadingState,
} from '../components/ui/Feedback';
import { CreateTeamModal } from '../features/teams/components/CreateTeamModal';
import { MyTeamsList } from '../features/teams/components/MyTeamsList';
import {
  TeamCatalog,
  TeamSearchBar,
} from '../features/teams/components/TeamCatalog';
import {
  TeamDetailsModal,
  type TeamOverview,
} from '../features/teams/components/TeamDetailsModal';
import { TeamInvitations } from '../features/teams/components/TeamInvitations';
import {
  teamFormSchema,
  type TeamFormInput,
  type TeamFormValues,
} from '../features/teams/schemas/team.schema';
import { useTeamsActions } from '../features/teams/hooks/useTeamsActions';
import { useTeamsData } from '../features/teams/hooks/useTeamsData';
import type {
  Team,
  TeamMembership,
  UserCard,
} from '../features/teams/types/teams.types';

export function TeamsPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const token = session!.access_token;
  const userId = session!.user.id;
  const [search, setSearch] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogPage, setCatalogPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamOverview | null>(null);
  const [inviteSearch, setInviteSearch] = useState('');
  const [submittedInviteSearch, setSubmittedInviteSearch] = useState('');
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamFormInput, undefined, TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: { name: '', description: '' },
  });
  const teamName = useWatch({ control, name: 'name' });
  const actions = useTeamsActions(token, userId);
  const data = useTeamsData({
    token,
    userId,
    catalogSearch,
    catalogPage,
    selectedTeam,
    inviteSearch: submittedInviteSearch,
  });
  const pendingRequestIds = new Set(
    data.requests
      .filter((item) => item.kind === 'request' && item.status === 'pending')
      .map((item) => item.teamId),
  );
  const invitations = data.requests.filter(
    (item) => item.kind === 'invitation' && item.status === 'pending',
  );
  const myTeamIds = new Set(data.myTeams.map((team) => team.id));
  const submitCreate = handleSubmit(async (values) => {
    const created = await actions.createTeam(values);
    if (created) {
      setShowCreate(false);
      reset();
      setCatalogPage(1);
    }
  });
  function openDetails(team: TeamOverview | TeamMembership) {
    setSelectedTeam(
      data.myTeams.find((membership) => membership.id === team.id) ?? team,
    );
    setInviteSearch('');
    setSubmittedInviteSearch('');
    actions.setError(null);
  }
  function searchCandidates(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inviteSearch.trim().length < 2) {
      actions.setError('Digite pelo menos 2 caracteres para buscar atletas.');
      return;
    }
    actions.setError(null);
    setSubmittedInviteSearch(inviteSearch.trim());
  }
  function searchTeams(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = search.trim();
    if (term.length < 2) {
      setCatalogSearch('');
      actions.setError(
        'Digite pelo menos 2 caracteres para buscar uma equipe.',
      );
      return;
    }
    actions.setError(null);
    setCatalogPage(1);
    setCatalogSearch(term);
  }
  async function requestJoin(team: Pick<Team, 'id' | 'name'>) {
    await actions.requestJoin(team);
  }
  async function respondToInvitation(id: string, action: 'accept' | 'decline') {
    await actions.respondToInvitation(id, action);
  }
  async function decideRequest(
    request: Parameters<typeof actions.decideTeamRequest>[1],
    action: 'accept' | 'decline',
  ) {
    await actions.decideTeamRequest(selectedTeam, request, action);
  }

  return (
    <>
      <PageHeading
        eyebrow="JOGUE EM EQUIPE"
        title="Equipes"
        description="Suas equipes, seus convites e as pessoas com quem você joga."
        action={
          <Button
            onClick={() => {
              reset();
              setShowCreate(true);
            }}
          >
            <i className="bi bi-plus-lg me-2" />
            Criar equipe
          </Button>
        }
      />
      {actions.notice && (
        <div
          className="alert alert-success d-flex align-items-center gap-2"
          role="status"
        >
          <i className="bi bi-check-circle-fill" />
          {actions.notice}
        </div>
      )}
      {(actions.error || data.error) && (
        <ErrorState
          message={
            actions.error ?? data.error ?? 'Não foi possível carregar equipes.'
          }
        />
      )}
      <TeamInvitations
        invitations={invitations}
        onRespond={(id, action) => void respondToInvitation(id, action)}
      />
      {data.isLoading && <LoadingState label="Carregando suas equipes..." />}
      <MyTeamsList
        teams={data.myTeams}
        onDetails={openDetails}
        onChat={(id) => navigate(`/chat/team/${id}`)}
      />
      <section
        className="mt-4"
        aria-label="Buscar uma equipe"
      >
        <h2 className="h5">Encontre uma equipe pelo nome</h2>
        <p className="text-body-secondary">
          Procure uma equipe que você conhece para ver quem joga nela e
          solicitar participação.
        </p>
        <TeamSearchBar
          value={search}
          onChange={setSearch}
          onSubmit={searchTeams}
        />
        {catalogSearch.length >= 2 && (
          <>
            <TeamCatalog
              teams={data.teams}
              loading={data.searching}
              error={Boolean(data.error)}
              myTeamIds={myTeamIds}
              pendingIds={pendingRequestIds}
              onDetails={(team: Team) => openDetails(team)}
              onJoin={(team) => void requestJoin(team)}
            />
            <nav
              aria-label="Páginas da busca de equipes"
              className="d-flex align-items-center gap-3 mb-4"
            >
              <Button
                variant="outline-secondary"
                disabled={catalogPage === 1 || data.searching}
                onClick={() => setCatalogPage((page) => page - 1)}
              >
                Anterior
              </Button>
              <span>Página {catalogPage}</span>
              <Button
                variant="outline-secondary"
                disabled={!data.hasNextPage || data.searching}
                onClick={() => setCatalogPage((page) => page + 1)}
              >
                Próxima
              </Button>
            </nav>
          </>
        )}
      </section>
      <CreateTeamModal
        show={showCreate}
        name={teamName}
        error={actions.error}
        busy={actions.isCreating}
        errors={errors}
        register={register}
        onHide={() => {
          setShowCreate(false);
          reset();
        }}
        onSubmit={(event) => void submitCreate(event)}
      />
      <TeamDetailsModal
        onUpdated={(updated) =>
          setSelectedTeam((current) =>
            current ? { ...current, ...updated } : current,
          )
        }
        team={selectedTeam}
        members={data.members}
        requests={data.teamRequests}
        candidates={data.inviteCandidates}
        loading={data.isLoadingDetails}
        search={inviteSearch}
        invitingUserId={actions.invitingUserId}
        joined={selectedTeam ? myTeamIds.has(selectedTeam.id) : false}
        requestPending={
          selectedTeam ? pendingRequestIds.has(selectedTeam.id) : false
        }
        onClose={() => setSelectedTeam(null)}
        onSearchChange={setInviteSearch}
        onSearchSubmit={searchCandidates}
        onInvite={(user: UserCard) =>
          void actions.inviteUser(selectedTeam, user)
        }
        onDecideRequest={(request, action) =>
          void decideRequest(request, action)
        }
        onRequestJoin={(team) => void requestJoin(team)}
        onOpenChat={(id) => navigate(`/chat/team/${id}`)}
      />
    </>
  );
}
