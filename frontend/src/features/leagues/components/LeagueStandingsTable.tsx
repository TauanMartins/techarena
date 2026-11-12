import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import type { LeagueStanding, LeagueSummary } from "../types/leagues.types";

export function LeagueStandingsTable({ standings, league }: { standings: LeagueStanding[]; league: LeagueSummary }) {
  return <Card className="border rounded-4 shadow-sm bg-body"><Card.Body><h3 className="h4">Classificação</h3>{!standings.length ? <p className="text-secondary mb-0">Inscreva equipes para iniciar a classificação.</p> : <div className="table-responsive"><Table hover className="align-middle mb-0"><thead><tr><th scope="col">Equipe</th>{league.tournamentFormat === "groups_knockout" && <th scope="col">Grupo</th>}<th scope="col">J</th><th scope="col">V</th><th scope="col">E</th><th scope="col">D</th><th scope="col">Pontos</th><th scope="col">Saldo</th></tr></thead><tbody>{standings.map((standing, index) => <tr key={standing.teamId}><th scope="row">{index + 1}. {standing.teamName}</th>{league.tournamentFormat === "groups_knockout" && <td>{standing.groupNumber ?? "—"}</td>}<td>{standing.played}</td><td>{standing.wins}</td><td>{standing.draws}</td><td>{standing.losses}</td><td>{standing.points}</td><td>{standing.scoreFor - standing.scoreAgainst}</td></tr>)}</tbody></Table></div>}</Card.Body></Card>;
}
