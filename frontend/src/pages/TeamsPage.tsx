import { useState, type FormEvent } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Image from "react-bootstrap/Image";
import Modal from "react-bootstrap/Modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeading,
} from "../components/Feedback";
import {
  TeamDetailsModal,
  type TeamOverview,
} from "../features/teams/TeamDetailsModal";
import { useTeamsData } from "../features/teams/useTeamsData";
import { api } from "../shared/api";
import {
  teamFormSchema,
  type TeamFormInput,
  type TeamFormValues,
} from "../shared/validation";
import type {
  MembershipRequest,
  Team,
  TeamMembership,
  UserCard,
} from "../shared/types";

export function TeamsPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const token = session!.access_token;
  const userId = session!.user.id;
  const {
    register: registerTeam,
    handleSubmit: handleTeamSubmit,
    reset: resetTeamForm,
    formState: { errors: teamFormErrors, isSubmitting: creating },
  } = useForm<TeamFormInput, undefined, TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: { name: "", description: "" },
  });
  const [search, setSearch] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamOverview | null>(null);
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteSubmittedSearch, setInviteSubmittedSearch] = useState("");
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const teamData = useTeamsData({
    token,
    userId,
    catalogSearch,
    selectedTeam,
    inviteSearch: inviteSubmittedSearch,
  });
  const {
    teams,
    myTeams,
    requests,
    members: teamMembers,
    teamRequests,
    inviteCandidates,
    isLoading: loading,
    isLoadingDetails: loadingTeamDetails,
  } = teamData;
  const displayError = error ?? teamData.error;
  const loadTeams = async (term: string) => {
    setError(null);
    setCatalogSearch(term);
    await teamData.invalidateTeamLists();
  };

  async function requestJoin(team: Pick<Team, "id" | "name">) {
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
          : "Não foi possível solicitar entrada na equipe.",
      );
    }
  }

  async function createTeam(values: TeamFormValues) {
    setError(null);
    try {
      await api.createTeam(token, values.name, values.description);
      setShowCreate(false);
      resetTeamForm();
      setNotice("Equipe criada.");
      await loadTeams(search);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível criar a equipe.",
      );
    }
  }

  async function respondToInvitation(
    requestId: string,
    action: "accept" | "decline",
  ) {
    setError(null);
    setNotice(null);
    try {
      await api.respondToTeamInvitation(token, requestId, action);
      setNotice(
        action === "accept"
          ? "Convite aceito. A equipe já aparece na sua lista."
          : "Convite recusado.",
      );
      await loadTeams(search);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível responder ao convite.",
      );
    }
  }

  async function showTeamDetails(team: TeamOverview | TeamMembership) {
    setSelectedTeam(team);
    setInviteSearch("");
    setInviteSubmittedSearch("");
    setError(null);
  }

  function searchInviteCandidates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inviteSearch.trim().length < 2) {
      setError("Digite pelo menos 2 caracteres para buscar atletas.");
      return;
    }
    setError(null);
    setInviteSubmittedSearch(inviteSearch.trim());
  }

  async function inviteUser(user: UserCard) {
    if (!selectedTeam) return;
    setInvitingUserId(user.id);
    setError(null);
    setNotice(null);
    try {
      await api.inviteToTeam(token, selectedTeam.id, user.id);
      setNotice(
        `Convite enviado para ${user.name ?? user.username ?? "atleta"}.`,
      );
      await teamData.invalidateTeamDetails(selectedTeam.id);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível convidar o atleta.",
      );
    } finally {
      setInvitingUserId(null);
    }
  }

  async function decideTeamRequest(
    request: MembershipRequest,
    action: "accept" | "decline",
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
        action === "accept"
          ? "Solicitação aceita. O atleta entrou para a equipe."
          : "Solicitação recusada.",
      );
      await Promise.all([
        teamData.invalidateTeamDetails(selectedTeam.id),
        loadTeams(search),
      ]);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível responder à solicitação.",
      );
    }
  }

  const pendingRequestIds = new Set(
    requests
      .filter(
        (request) => request.kind === "request" && request.status === "pending",
      )
      .map((request) => request.teamId),
  );
  const invitations = requests.filter(
    (request) => request.kind === "invitation" && request.status === "pending",
  );
  const myTeamIds = new Set(myTeams.map((team) => team.id));

  function closeCreateTeamModal() {
    setShowCreate(false);
    resetTeamForm();
  }

  return (
    <>
      <PageHeading
        eyebrow="JOGUE EM EQUIPE"
        title="Equipes"
        description="Descubra grupos, solicite participação ou crie sua própria equipe."
        action={
          <Button
            onClick={() => {
              resetTeamForm();
              setShowCreate(true);
            }}
          >
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
      {displayError && <ErrorState message={displayError} />}

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
                      void respondToInvitation(invitation.id, "accept")
                    }
                  >
                    Aceitar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() =>
                      void respondToInvitation(invitation.id, "decline")
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
                    <p>{team.description || "Equipe TechArena"}</p>
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
                          "Uma equipe pronta para receber novos atletas."}
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
                            joined ? "outline-success" : "outline-primary"
                          }
                          disabled={joined || requested}
                          onClick={() => void requestJoin(team)}
                        >
                          {joined
                            ? "Você já participa"
                            : requested
                              ? "Solicitação enviada"
                              : "Solicitar participação"}
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

      <Modal show={showCreate} onHide={closeCreateTeamModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Criar equipe</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleTeamSubmit(createTeam)} noValidate>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="create-team-name">Nome</Form.Label>
              <Form.Control
                id="create-team-name"
                isInvalid={!!teamFormErrors.name}
                {...registerTeam("name")}
              />
              <Form.Control.Feedback type="invalid">
                {teamFormErrors.name?.message}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group>
              <Form.Label htmlFor="create-team-description">
                Descrição
              </Form.Label>
              <Form.Control
                id="create-team-description"
                as="textarea"
                rows={3}
                isInvalid={!!teamFormErrors.description}
                {...registerTeam("description")}
              />
              <Form.Control.Feedback type="invalid">
                {teamFormErrors.description?.message}
              </Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={closeCreateTeamModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? "Criando..." : "Criar equipe"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      <TeamDetailsModal
        team={selectedTeam}
        members={teamMembers}
        requests={teamRequests}
        candidates={inviteCandidates}
        loading={loadingTeamDetails}
        search={inviteSearch}
        invitingUserId={invitingUserId}
        joined={selectedTeam ? myTeamIds.has(selectedTeam.id) : false}
        requestPending={
          selectedTeam ? pendingRequestIds.has(selectedTeam.id) : false
        }
        onClose={() => setSelectedTeam(null)}
        onSearchChange={setInviteSearch}
        onSearchSubmit={(event) => void searchInviteCandidates(event)}
        onInvite={(candidate) => void inviteUser(candidate)}
        onDecideRequest={(request, action) =>
          void decideTeamRequest(request, action)
        }
        onRequestJoin={(team) => void requestJoin(team)}
        onOpenChat={(teamId) => navigate(`/chat/team/${teamId}`)}
      />
    </>
  );
}
