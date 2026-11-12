import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import type { LeagueTeamInvitation } from "../types/leagues.types";

export function LeagueInvitations({ invitations, saving, onRespond }: { invitations: LeagueTeamInvitation[]; saving: boolean; onRespond: (id: string, action: "accept" | "decline") => void }) {
  if (!invitations.length) return null;
  return <Card className="border rounded-4 shadow-sm bg-body mb-4"><Card.Body><h2 className="h4">Convites para suas equipes</h2><div className="d-grid gap-2">{invitations.map((invitation) => <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 border rounded p-3" key={invitation.id}>
    <span><strong>{invitation.teamName}</strong> foi convidada para <strong>{invitation.leagueName}</strong>.</span><div className="d-flex gap-2"><Button size="sm" disabled={saving} onClick={() => onRespond(invitation.id, "accept")}>Aceitar</Button><Button size="sm" variant="outline-secondary" disabled={saving} onClick={() => onRespond(invitation.id, "decline")}>Recusar</Button></div>
  </div>)}</div></Card.Body></Card>;
}
