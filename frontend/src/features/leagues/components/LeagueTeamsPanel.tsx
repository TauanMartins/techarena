import type { FormEvent } from "react";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import type { LeagueDetails, LeagueSummary } from "../types/leagues.types";
import type { TeamMembership, Team } from "../../../shared/types";

export function LeagueTeamsPanel({ league, details, eligibleTeams, teamSearch, inviteTeamId, teamSearchResults, invitableTeams, searching, saving, onRegister, onSearchChange, onSearch, onInvite, onRemove }: {
  league: LeagueSummary; details: LeagueDetails; eligibleTeams: TeamMembership[]; teamSearch: string; inviteTeamId: string;
  teamSearchResults: Team[]; invitableTeams: Team[]; searching: boolean; saving: boolean;
  onRegister: (event: FormEvent<HTMLFormElement>) => void; onSearchChange: (value: string) => void;
  onSearch: (event: FormEvent<HTMLFormElement>) => void; onInvite: (event: FormEvent<HTMLFormElement>) => void;
  onRemove: (teamId: string) => void;
}) {
  return <Card className="content-card mb-4"><Card.Body><h3 className="h4">Equipes inscritas</h3>
    {!details.teams.length ? <p className="text-secondary">Ainda não há equipes inscritas.</p> : <ul className="list-group mb-3">{details.teams.map((team) => {
      const canRemove = league.isOwner || details.myCaptainTeamIds.includes(team.id);
      return <li className="list-group-item d-flex justify-content-between align-items-center gap-2" key={team.id}><span><strong>{team.name}</strong>{team.groupNumber && <Badge bg="secondary" className="ms-2">Grupo {team.groupNumber}</Badge>}{team.captainName && <span className="text-secondary ms-2">Capitão: {team.captainName}</span>}</span>
        {canRemove && league.status === "open" && <Button variant="outline-danger" size="sm" disabled={saving} onClick={() => onRemove(team.id)}>Remover</Button>}
      </li>;
    })}</ul>}
    {league.status === "open" && eligibleTeams.length > 0 && <Form onSubmit={onRegister} className="d-flex gap-2"><Form.Select aria-label="Equipe para inscrever" name="teamId" required defaultValue=""><option value="">Selecione uma equipe que você lidera</option>{eligibleTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</Form.Select><Button type="submit" disabled={saving}>Inscrever</Button></Form>}
    {league.isOwner && league.status === "open" && <div className="border-top pt-3 mt-3"><h4 className="h5">Convidar outra equipe</h4><Form className="d-flex gap-2 mb-3" onSubmit={onSearch}><Form.Control aria-label="Buscar equipe para convidar" placeholder="Nome da equipe" value={teamSearch} onChange={(event) => onSearchChange(event.target.value)} /><Button type="submit" variant="outline-primary">Buscar</Button></Form>
      {!!invitableTeams.length && <Form className="d-flex gap-2" onSubmit={onInvite}><Form.Select aria-label="Equipe para convidar" name="teamId" value={inviteTeamId} required><option value="">Selecione uma equipe</option>{invitableTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</Form.Select><Button type="submit" disabled={saving || !inviteTeamId}>Convidar</Button></Form>}
      {searching && <p className="text-secondary mb-0">Buscando equipes...</p>}{!searching && teamSearch.trim().length >= 2 && !invitableTeams.length && <p className="text-secondary mb-0">{teamSearchResults.length === 0 ? "Nenhuma equipe encontrada." : "As equipes encontradas já estão inscritas ou têm convite pendente."}</p>}
      {!!details.invitations.length && <div className="mt-3"><span className="small text-secondary">Convites pendentes:</span><ul className="small mb-0">{details.invitations.map((invitation) => <li key={invitation.id}>{invitation.teamName}</li>)}</ul></div>}
    </div>}
  </Card.Body></Card>;
}
