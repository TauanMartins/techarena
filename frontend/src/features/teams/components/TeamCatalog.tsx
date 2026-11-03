import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Image from "react-bootstrap/Image";
import type { Team } from "../types/teams.types";
import { EmptyState, LoadingState } from "../../../components/Feedback";

export function TeamCatalog({ teams, loading, error, myTeamIds, pendingIds, onDetails, onJoin }: { teams: Team[]; loading: boolean; error: boolean; myTeamIds: Set<string>; pendingIds: Set<string>; onDetails: (team: Team) => void; onJoin: (team: Team) => void }) {
  return <section className="content-section"><div className="section-title-row"><div><span className="eyebrow">COMUNIDADE</span><h2>Encontrar equipes</h2></div></div>
    {loading && <LoadingState label="Carregando equipes..." />}
    {!loading && !error && !teams.length && <EmptyState icon="bi-people" title="Nenhuma equipe encontrada" description="Tente outra busca ou crie uma nova equipe." />}
    {!loading && teams.length > 0 && <div className="row g-3">{teams.map((team) => {
      const joined = myTeamIds.has(team.id); const requested = pendingIds.has(team.id);
      return <div className="col-md-6 col-xl-4" key={team.id}><Card className="team-card h-100"><Card.Body>
        {team.image ? <Image className="team-card-image" src={team.image} alt={`Imagem da equipe ${team.name}`} /> : <div className="team-mark"><i className="bi bi-people-fill" /></div>}
        <h3>{team.name}</h3><p>{team.description || "Uma equipe pronta para receber novos atletas."}</p>
        <div className="d-flex flex-wrap gap-2 mt-3"><Button variant="outline-secondary" onClick={() => onDetails(team)}>Detalhes</Button><Button variant={joined ? "outline-success" : "outline-primary"} disabled={joined || requested} onClick={() => onJoin(team)}>{joined ? "Você já participa" : requested ? "Solicitação enviada" : "Solicitar participação"}</Button></div>
      </Card.Body></Card></div>;
    })}</div>}
  </section>;
}

export function TeamSearchBar({ value, onChange, onSubmit }: { value: string; onChange: (value: string) => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return <Form className="search-bar mb-4" onSubmit={onSubmit}><i className="bi bi-search" aria-hidden="true" /><Form.Control aria-label="Buscar equipes" placeholder="Buscar equipe pelo nome" value={value} onChange={(event) => onChange(event.target.value)} /><Button type="submit" variant="outline-primary">Buscar</Button></Form>;
}
