import Button from "react-bootstrap/Button";
import type { MembershipRequest } from "../types/teams.types";

export function TeamInvitations({ invitations, onRespond }: { invitations: MembershipRequest[]; onRespond: (id: string, action: "accept" | "decline") => void }) {
  if (!invitations.length) return null;
  return <section className="content-section"><div className="section-title-row"><div><span className="eyebrow">CONVITES RECEBIDOS</span><h2>Entre para uma equipe</h2></div></div><div className="people-list">
    {invitations.map((invitation) => <div className="person-row" key={invitation.id}><div className="team-mark"><i className="bi bi-people-fill" /></div><div className="person-info"><strong>{invitation.teamName}</strong><span>Você recebeu um convite para esta equipe.</span></div><div className="d-flex gap-2">
      <Button size="sm" onClick={() => onRespond(invitation.id, "accept")}>Aceitar</Button><Button size="sm" variant="outline-secondary" onClick={() => onRespond(invitation.id, "decline")}>Recusar</Button>
    </div></div>)}
  </div></section>;
}
