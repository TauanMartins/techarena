import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Image from "react-bootstrap/Image";
import type { TeamMembership } from "../types/teams.types";

export function MyTeamsList({ teams, onDetails, onChat }: { teams: TeamMembership[]; onDetails: (team: TeamMembership) => void; onChat: (id: string) => void }) {
  return <section className="content-section"><div className="section-title-row"><div><span className="eyebrow">SEUS GRUPOS</span><h2>Minhas equipes</h2></div></div>
    {!teams.length && <Card className="content-card mb-4"><Card.Body>Você ainda não faz parte de uma equipe. Explore as opções abaixo para começar.</Card.Body></Card>}
    {teams.length > 0 && <div className="row g-3 mb-4">{teams.map((team) => <div className="col-md-6 col-xl-4" key={team.id}><Card className="team-card h-100"><Card.Body>
      {team.image ? <Image className="team-card-image" src={team.image} alt={`Imagem da equipe ${team.name}`} /> : <div className="team-mark"><i className="bi bi-people-fill" /></div>}
      <span className="team-role">{team.role}</span><h3>{team.name}</h3><p>{team.description || "Equipe TechArena"}</p>
      <div className="d-flex flex-wrap gap-2 mt-3"><Button variant="outline-secondary" onClick={() => onDetails(team)}>Detalhes e solicitações</Button><Button variant="outline-primary" onClick={() => onChat(team.id)}>Ir para conversa</Button></div>
    </Card.Body></Card></div>)}</div>}
  </section>;
}
