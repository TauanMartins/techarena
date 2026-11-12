import Button from "react-bootstrap/Button";
import type { MembershipRequest } from "../types/teams.types";

export function TeamInvitations({ invitations, onRespond }: { invitations: MembershipRequest[]; onRespond: (id: string, action: "accept" | "decline") => void }) {
  if (!invitations.length) return null;
  return <section className="my-4"><div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3"><div><span className="d-block small fw-semibold text-body-secondary mb-1">CONVITES RECEBIDOS</span><h2>Entre para uma equipe</h2></div></div><div className="list-group rounded-3">
    {invitations.map((invitation) => <div className="list-group-item d-flex flex-wrap align-items-center gap-3 p-3" key={invitation.id}><div className="d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary-emphasis p-3 rounded-3 fs-4"><i className="bi bi-people-fill" /></div><div className="d-flex flex-column gap-1 text-break me-auto"><strong>{invitation.teamName}</strong><span>Você recebeu um convite para esta equipe.</span></div><div className="d-flex gap-2">
      <Button size="sm" onClick={() => onRespond(invitation.id, "accept")}>Aceitar</Button><Button size="sm" variant="outline-secondary" onClick={() => onRespond(invitation.id, "decline")}>Recusar</Button>
    </div></div>)}
  </div></section>;
}
