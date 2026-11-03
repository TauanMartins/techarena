import type { FormEvent } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import type { MembershipRequest, TeamMember, UserCard } from "../types/teams.types";
import { ProfileAvatar } from "../../../components/ui/ProfileAvatar";

export function TeamInvitePanel({ members, requests, candidates, search, invitingUserId, onSearchChange, onSearchSubmit, onInvite, onDecideRequest }: {
  members: TeamMember[]; requests: MembershipRequest[]; candidates: UserCard[]; search: string; invitingUserId: string | null;
  onSearchChange: (value: string) => void; onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onInvite: (user: UserCard) => void; onDecideRequest: (request: MembershipRequest, action: "accept" | "decline") => void;
}) {
  const pendingRequests = requests.filter((request) => request.kind === "request" && request.status === "pending");
  return <>
    <h3 className="h6">Convidar atletas</h3><Form className="search-bar mb-3" onSubmit={onSearchSubmit}><i className="bi bi-search" aria-hidden="true" /><Form.Control aria-label="Buscar atleta para convidar" placeholder="Buscar por nome ou usuário" value={search} onChange={(event) => onSearchChange(event.target.value)} /><Button type="submit" variant="outline-primary">Buscar</Button></Form>
    <div className="people-list">{candidates.map((candidate) => {
      const alreadyMember = members.some((member) => member.id === candidate.id);
      const pending = requests.some((request) => request.userId === candidate.id && request.status === "pending");
      return <div className="person-row" key={candidate.id}><ProfileAvatar name={candidate.name} image={candidate.image} /><div className="person-info"><strong>{candidate.name ?? "Atleta"}</strong><span>{candidate.username ? `@${candidate.username}` : "TechArena"}</span></div>
        <Button size="sm" disabled={alreadyMember || pending || invitingUserId === candidate.id} onClick={() => onInvite(candidate)}>{alreadyMember ? "Já participa" : pending ? "Convite pendente" : invitingUserId === candidate.id ? "Convidando..." : "Convidar"}</Button>
      </div>;
    })}</div>
    {pendingRequests.length > 0 && <><hr /><h3 className="h6">Solicitações para entrar</h3><div className="people-list">{pendingRequests.map((request) => <div className="person-row" key={request.id}>
      <div className="person-avatar">{request.userName?.slice(0, 1).toUpperCase() ?? <i className="bi bi-person" />}</div><div className="person-info"><strong>{request.userName ?? "Atleta"}</strong><span>Solicitou entrar na equipe</span></div>
      <div className="d-flex gap-2"><Button size="sm" onClick={() => onDecideRequest(request, "accept")}>Aceitar</Button><Button size="sm" variant="outline-secondary" onClick={() => onDecideRequest(request, "decline")}>Recusar</Button></div>
    </div>)}</div></>}
  </>;
}
