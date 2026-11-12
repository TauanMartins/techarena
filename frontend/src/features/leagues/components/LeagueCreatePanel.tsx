import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import type { SubmitEvent } from "react";
import type { Sport } from "../../../shared/types";
import { LeagueSettingsFields } from "./LeagueSettingsFields";

export function LeagueCreatePanel({ sports, saving, onSubmit }: { sports: Sport[]; saving: boolean; onSubmit: (event: SubmitEvent<HTMLFormElement>) => void }) {
  return <Card className="border rounded-4 shadow-sm bg-body mb-4"><Card.Body><h2 className="h4">Nova liga</h2><Form onSubmit={onSubmit} noValidate><LeagueSettingsFields prefix="league" sports={sports} /><Button className="mt-3" type="submit" disabled={saving}>{saving ? "Salvando..." : "Criar liga"}</Button></Form></Card.Body></Card>;
}
