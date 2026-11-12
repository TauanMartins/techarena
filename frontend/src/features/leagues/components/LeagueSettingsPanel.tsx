import type { SubmitEvent } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import type { LeagueSummary } from "../types/leagues.types";
import { LeagueSettingsFields } from "./LeagueSettingsFields";

export function LeagueSettingsPanel({ league, saving, onSubmit, onStatus }: { league: LeagueSummary; saving: boolean; onSubmit: (event: SubmitEvent<HTMLFormElement>) => void; onStatus: (status: "completed" | "canceled") => void }) {
  return <Card className="content-card mb-4"><Card.Body><h3 className="h4">Gerenciar liga</h3><Form onSubmit={onSubmit} noValidate><LeagueSettingsFields prefix="edit-league" league={league} lockedFormat={league.matchCount > 0} /><div className="d-flex flex-wrap gap-2 mt-3">
    <Button type="submit" disabled={saving}>Salvar configurações</Button>{league.status === "active" && <Button type="button" variant="success" disabled={saving} onClick={() => onStatus("completed")}>Encerrar liga</Button>}<Button type="button" variant="outline-danger" disabled={saving} onClick={() => onStatus("canceled")}>Cancelar liga</Button>
  </div></Form></Card.Body></Card>;
}
