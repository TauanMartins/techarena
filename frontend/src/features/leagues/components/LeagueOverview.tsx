import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import type { LeagueSummary } from "../types/leagues.types";

export function LeagueOverview({ league }: { league: LeagueSummary }) {
  return <Card className="border rounded-4 shadow-sm bg-body mb-4"><Card.Body><div className="d-flex justify-content-between align-items-start gap-3"><div>
    <span className="d-block small fw-semibold text-body-secondary mb-1">{league.sportName ?? "COMPETIÇÃO"}</span><h2 className="h3">{league.name}</h2><p className="mb-1">{league.description || "Sem descrição."}</p><span className="text-secondary">Organizada por {league.ownerName ?? "membro da comunidade"}</span>
    <div className="small text-secondary mt-2">{league.tournamentFormat === "round_robin" ? "Pontos corridos · 3 pontos por vitória, 1 por empate" : league.tournamentFormat === "knockout" ? "Eliminação simples · mata-mata" : `Grupos + mata-mata · ${league.groupCount} grupos · ${league.qualifiersPerGroup} classificados por grupo`}</div>
  </div><Badge bg={league.status === "active" ? "success" : "secondary"}>{league.status === "open" ? "Inscrições abertas" : league.status === "active" ? "Em andamento" : league.status === "completed" ? "Encerrada" : "Cancelada"}</Badge></div></Card.Body></Card>;
}
