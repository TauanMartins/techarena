import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import type { LeagueSummary } from "../types/leagues.types";

export function LeagueCatalog({ leagues, selectedId, onSelect }: { leagues: LeagueSummary[]; selectedId: string; onSelect: (id: string) => void }) {
  return <aside className="col-lg-4"><h2 className="h4 mb-3">Ligas disponíveis</h2><div className="d-grid gap-2">{leagues.map((league) => <Card key={league.id} className={`content-card ${selectedId === league.id ? "border-primary" : ""}`}><Card.Body>
    <div className="d-flex justify-content-between align-items-start gap-2"><div><h3 className="h5 mb-1">{league.name}</h3><div className="text-secondary">{league.sportName ?? "Modalidade não definida"}</div></div>{league.isOwner && <Badge bg="primary">Organizador</Badge>}</div>
    <p className="small text-secondary mt-2 mb-2">{league.teamCount} equipes · {league.completedMatchCount}/{league.matchCount} partidas concluídas</p>
    <div className="small mb-2">{league.status === "open" ? "Inscrições abertas" : league.status === "active" ? "Em andamento" : league.status === "completed" ? "Encerrada" : "Cancelada"}</div>
    <Button variant={selectedId === league.id ? "primary" : "outline-primary"} size="sm" onClick={() => onSelect(league.id)}>Ver liga</Button>
  </Card.Body></Card>)}</div></aside>;
}
