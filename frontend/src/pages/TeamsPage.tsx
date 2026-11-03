import { useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "react-bootstrap/Button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { ErrorState, PageHeading } from "../components/ui/Feedback";
import { CreateTeamModal } from "../features/teams/components/CreateTeamModal";
import { MyTeamsList } from "../features/teams/components/MyTeamsList";
import { TeamCatalog, TeamSearchBar } from "../features/teams/components/TeamCatalog";
import { TeamDetailsModal, type TeamOverview } from "../features/teams/components/TeamDetailsModal";
import { TeamInvitations } from "../features/teams/components/TeamInvitations";
import { teamFormSchema, type TeamFormInput, type TeamFormValues } from "../features/teams/schemas/team.schema";
import { useTeamsActions } from "../features/teams/hooks/useTeamsActions";
import { useTeamsData } from "../features/teams/hooks/useTeamsData";
import type { Team, TeamMembership, UserCard } from "../features/teams/types/teams.types";

export function TeamsPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const token = session!.access_token;
  const userId = session!.user.id;
  const [search, setSearch] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamOverview | null>(null);
  const [inviteSearch, setInviteSearch] = useState("");
  const [submittedInviteSearch, setSubmittedInviteSearch] = useState("");
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TeamFormInput, undefined, TeamFormValues>({ resolver: zodResolver(teamFormSchema), defaultValues: { name: "", description: "" } });
  const actions = useTeamsActions(token, userId);
  const data = useTeamsData({ token, userId, catalogSearch, selectedTeam, inviteSearch: submittedInviteSearch });
  const pendingRequestIds = new Set(data.requests.filter((item) => item.kind === "request" && item.status === "pending").map((item) => item.teamId));
  const invitations = data.requests.filter((item) => item.kind === "invitation" && item.status === "pending");
  const myTeamIds = new Set(data.myTeams.map((team) => team.id));
  const submitCreate = handleSubmit(async (values) => {
    const created = await actions.createTeam(values);
    if (created) { setShowCreate(false); reset(); setCatalogSearch(search); }
  });
  function openDetails(team: TeamOverview | TeamMembership) {
    setSelectedTeam(team);
    setInviteSearch("");
    setSubmittedInviteSearch("");
    actions.setError(null);
  }
  function searchCandidates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inviteSearch.trim().length < 2) { actions.setError("Digite pelo menos 2 caracteres para buscar atletas."); return; }
    actions.setError(null);
    setSubmittedInviteSearch(inviteSearch.trim());
  }
  function searchTeams(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCatalogSearch(search);
  }
  async function requestJoin(team: Pick<Team, "id" | "name">) {
    const result = await actions.requestJoin(team);
    if (result) setCatalogSearch(search);
  }
  async function respondToInvitation(id: string, action: "accept" | "decline") {
    const result = await actions.respondToInvitation(id, action);
    if (result) setCatalogSearch(search);
  }
  async function decideRequest(request: Parameters<typeof actions.decideTeamRequest>[1], action: "accept" | "decline") {
    const result = await actions.decideTeamRequest(selectedTeam, request, action);
    if (result) setCatalogSearch(search);
  }

  return <>
    <PageHeading eyebrow="JOGUE EM EQUIPE" title="Equipes" description="Descubra grupos, solicite participação ou crie sua própria equipe." action={<Button onClick={() => { reset(); setShowCreate(true); }}><i className="bi bi-plus-lg me-2" />Criar equipe</Button>} />
    {actions.notice && <div className="inline-notice" role="status"><i className="bi bi-check-circle-fill" />{actions.notice}</div>}
    {(actions.error || data.error) && <ErrorState message={actions.error ?? data.error ?? "Não foi possível carregar equipes."} />}
    <TeamSearchBar value={search} onChange={setSearch} onSubmit={searchTeams} />
    <TeamInvitations invitations={invitations} onRespond={(id, action) => void respondToInvitation(id, action)} />
    <MyTeamsList teams={data.myTeams} onDetails={openDetails} onChat={(id) => navigate(`/chat/team/${id}`)} />
    <TeamCatalog teams={data.teams} loading={data.isLoading} error={Boolean(data.error)} myTeamIds={myTeamIds} pendingIds={pendingRequestIds} onDetails={(team: Team) => openDetails(team)} onJoin={(team) => void requestJoin(team)} />
    <CreateTeamModal show={showCreate} busy={actions.isCreating} errors={errors} register={register} onHide={() => { setShowCreate(false); reset(); }} onSubmit={(event) => void submitCreate(event)} />
    <TeamDetailsModal team={selectedTeam} members={data.members} requests={data.teamRequests} candidates={data.inviteCandidates} loading={data.isLoadingDetails} search={inviteSearch} invitingUserId={actions.invitingUserId} joined={selectedTeam ? myTeamIds.has(selectedTeam.id) : false} requestPending={selectedTeam ? pendingRequestIds.has(selectedTeam.id) : false} onClose={() => setSelectedTeam(null)} onSearchChange={setInviteSearch} onSearchSubmit={searchCandidates} onInvite={(user: UserCard) => void actions.inviteUser(selectedTeam, user)} onDecideRequest={(request, action) => void decideRequest(request, action)} onRequestJoin={(team) => void requestJoin(team)} onOpenChat={(id) => navigate(`/chat/team/${id}`)} />
  </>;
}
