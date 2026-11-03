import type { FormEvent } from "react";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import Modal from "react-bootstrap/Modal";
import type { MembershipRequest, TeamMember, TeamMembership, TeamOverview, UserCard } from "../types/teams.types";
import { TeamMembersList } from "./TeamMembersList";
import { TeamInvitePanel } from "./TeamInvitePanel";

export type { TeamOverview } from "../types/teams.types";
interface TeamDetailsModalProps {
  team: TeamOverview | TeamMembership | null; members: TeamMember[]; requests: MembershipRequest[]; candidates: UserCard[];
  loading: boolean; search: string; invitingUserId: string | null; joined: boolean; requestPending: boolean;
  onClose: () => void; onSearchChange: (value: string) => void; onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onInvite: (candidate: UserCard) => void; onDecideRequest: (request: MembershipRequest, action: "accept" | "decline") => void;
  onRequestJoin: (team: TeamOverview) => void; onOpenChat: (teamId: string) => void;
}

export function TeamDetailsModal(props: TeamDetailsModalProps) {
  const { team, members, requests, candidates, loading, search, invitingUserId, joined, requestPending, onClose, onSearchChange, onSearchSubmit, onInvite, onDecideRequest, onRequestJoin, onOpenChat } = props;
  return <Modal show={team !== null} onHide={onClose} centered size="lg"><Modal.Header closeButton><Modal.Title>{team?.name ?? "Equipe"}</Modal.Title></Modal.Header><Modal.Body>
    {team && <>
      {team.image && <Image className="team-detail-image mb-3" src={team.image} alt={`Imagem da equipe ${team.name}`} />}
      <p>{team.description || "Esta equipe ainda não tem uma descrição."}</p>
      <p className="text-secondary">{team.role ? `Seu papel: ${team.role}` : "Explore a equipe e solicite participação para entrar."}</p><hr />
      <TeamMembersList members={members} loading={loading} />
      {team.role === "captain" && <TeamInvitePanel members={members} requests={requests} candidates={candidates} search={search} invitingUserId={invitingUserId} onSearchChange={onSearchChange} onSearchSubmit={onSearchSubmit} onInvite={onInvite} onDecideRequest={onDecideRequest} />}
      {!team.role && <Button variant={joined ? "outline-success" : "outline-primary"} disabled={joined || requestPending} onClick={() => onRequestJoin(team)}> {joined ? "Você já participa" : requestPending ? "Solicitação enviada" : "Solicitar participação"}</Button>}
    </>}
  </Modal.Body>{team && joined && <Modal.Footer><Button variant="outline-primary" onClick={() => onOpenChat(team.id)}>Ir para conversa</Button></Modal.Footer>}</Modal>;
}
