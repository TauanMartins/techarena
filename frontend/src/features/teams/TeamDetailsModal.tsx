import type { FormEvent } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Image from "react-bootstrap/Image";
import Modal from "react-bootstrap/Modal";
import { ProfileAvatar } from "../../components/ProfileAvatar";
import { LoadingState } from "../../components/Feedback";
import type {
  MembershipRequest,
  Team,
  TeamMember,
  TeamMembership,
  UserCard,
} from "../../shared/types";

export type TeamOverview = Pick<
  Team,
  "id" | "name" | "description" | "image"
> & {
  role?: string;
};

interface TeamDetailsModalProps {
  team: TeamOverview | TeamMembership | null;
  members: TeamMember[];
  requests: MembershipRequest[];
  candidates: UserCard[];
  loading: boolean;
  search: string;
  invitingUserId: string | null;
  joined: boolean;
  requestPending: boolean;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onInvite: (candidate: UserCard) => void;
  onDecideRequest: (
    request: MembershipRequest,
    action: "accept" | "decline",
  ) => void;
  onRequestJoin: (team: TeamOverview) => void;
  onOpenChat: (teamId: string) => void;
}

export function TeamDetailsModal({
  team,
  members,
  requests,
  candidates,
  loading,
  search,
  invitingUserId,
  joined,
  requestPending,
  onClose,
  onSearchChange,
  onSearchSubmit,
  onInvite,
  onDecideRequest,
  onRequestJoin,
  onOpenChat,
}: TeamDetailsModalProps) {
  const pendingRequests = requests.filter(
    (request) => request.kind === "request" && request.status === "pending",
  );

  return (
    <Modal show={team !== null} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{team?.name ?? "Equipe"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {team && (
          <>
            {team.image && (
              <Image
                className="team-detail-image mb-3"
                src={team.image}
                alt={`Imagem da equipe ${team.name}`}
              />
            )}
            <p>
              {team.description || "Esta equipe ainda não tem uma descrição."}
            </p>
            <p className="text-secondary">
              {team.role
                ? `Seu papel: ${team.role}`
                : "Explore a equipe e solicite participação para entrar."}
            </p>
            <hr />
            <h3 className="h6">Membros ({members.length})</h3>
            {loading && <LoadingState label="Carregando membros..." />}
            {!loading && members.length === 0 && (
              <p className="text-secondary">Nenhum membro encontrado.</p>
            )}
            <div className="people-list mb-3">
              {members.map((member) => (
                <div className="person-row" key={member.id}>
                  <ProfileAvatar name={member.name} image={member.image} />
                  <div className="person-info">
                    <strong>{member.name ?? "Atleta"}</strong>
                    <span>
                      {member.username ? `@${member.username}` : member.role}
                    </span>
                  </div>
                  <span className="team-role">
                    {member.role === "captain" ? "Capitão" : "Membro"}
                  </span>
                </div>
              ))}
            </div>
            {team.role === "captain" && (
              <>
                <h3 className="h6">Convidar atletas</h3>
                <Form className="search-bar mb-3" onSubmit={onSearchSubmit}>
                  <i className="bi bi-search" aria-hidden="true" />
                  <Form.Control
                    aria-label="Buscar atleta para convidar"
                    placeholder="Buscar por nome ou usuário"
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                  />
                  <Button type="submit" variant="outline-primary">
                    Buscar
                  </Button>
                </Form>
                <div className="people-list">
                  {candidates.map((candidate) => {
                    const alreadyMember = members.some(
                      (member) => member.id === candidate.id,
                    );
                    const pending = requests.some(
                      (request) =>
                        request.userId === candidate.id &&
                        request.status === "pending",
                    );
                    return (
                      <div className="person-row" key={candidate.id}>
                        <ProfileAvatar
                          name={candidate.name}
                          image={candidate.image}
                        />
                        <div className="person-info">
                          <strong>{candidate.name ?? "Atleta"}</strong>
                          <span>
                            {candidate.username
                              ? `@${candidate.username}`
                              : "TechArena"}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          disabled={
                            alreadyMember ||
                            pending ||
                            invitingUserId === candidate.id
                          }
                          onClick={() => onInvite(candidate)}
                        >
                          {alreadyMember
                            ? "Já participa"
                            : pending
                              ? "Convite pendente"
                              : invitingUserId === candidate.id
                                ? "Convidando..."
                                : "Convidar"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
                {pendingRequests.length > 0 && (
                  <>
                    <hr />
                    <h3 className="h6">Solicitações para entrar</h3>
                    <div className="people-list">
                      {pendingRequests.map((request) => (
                        <div className="person-row" key={request.id}>
                          <div className="person-avatar">
                            {request.userName?.slice(0, 1).toUpperCase() ?? (
                              <i className="bi bi-person" />
                            )}
                          </div>
                          <div className="person-info">
                            <strong>{request.userName ?? "Atleta"}</strong>
                            <span>Solicitou entrar na equipe</span>
                          </div>
                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => onDecideRequest(request, "accept")}
                            >
                              Aceitar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              onClick={() =>
                                onDecideRequest(request, "decline")
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
            {!team.role && (
              <div className="d-flex flex-wrap gap-2">
                <Button
                  variant={joined ? "outline-success" : "outline-primary"}
                  disabled={joined || requestPending}
                  onClick={() => onRequestJoin(team)}
                >
                  {joined
                    ? "Você já participa"
                    : requestPending
                      ? "Solicitação enviada"
                      : "Solicitar participação"}
                </Button>
              </div>
            )}
          </>
        )}
      </Modal.Body>
      {team && joined && (
        <Modal.Footer>
          <Button variant="outline-primary" onClick={() => onOpenChat(team.id)}>
            Ir para conversa
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  );
}
