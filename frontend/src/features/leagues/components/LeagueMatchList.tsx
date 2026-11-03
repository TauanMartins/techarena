import Card from "react-bootstrap/Card";
import type { FormEvent } from "react";
import type { LeagueArena, LeagueMatch } from "../types/leagues.types";
import type { Schedule } from "../../../shared/types";
import { LeagueMatchCard } from "./LeagueMatchCard";

export function LeagueMatchList({ matches, isOwner, date, arenas, arenaId, availability, scores, saving, reschedulingId, onScoreChange, onSaveResult, onCancel, onToggleReschedule, onDateChange, onArenaChange, onReschedule }: {
  matches: LeagueMatch[]; isOwner: boolean; date: string; arenas: LeagueArena[]; arenaId: string; availability: Schedule[];
  scores: Record<string, { home: string; away: string }>; saving: boolean; reschedulingId: string;
  onScoreChange: (matchId: string, side: "home" | "away", value: string) => void;
  onSaveResult: (match: LeagueMatch) => void; onCancel: (matchId: string) => void;
  onToggleReschedule: (matchId: string) => void; onDateChange: (date: string) => void; onArenaChange: (id: string) => void;
  onReschedule: (event: FormEvent<HTMLFormElement>, match: LeagueMatch) => void;
}) {
  return <Card className="content-card mb-4"><Card.Body><h3 className="h4">Partidas</h3>{!matches.length ? <p className="text-secondary mb-0">As partidas agendadas para esta liga aparecerão aqui.</p> : <div className="d-grid gap-3">{matches.map((match) => <LeagueMatchCard key={match.id} match={match} canRecordResult={isOwner} canManage={isOwner} isRescheduling={reschedulingId === match.id} date={date} arenas={arenas} arenaId={arenaId} availability={availability} scores={scores[match.id] ?? { home: match.result ? String(match.result.homeScore) : "", away: match.result ? String(match.result.awayScore) : "" }} saving={saving} onScoreChange={(side, value) => onScoreChange(match.id, side, value)} onSaveResult={() => onSaveResult(match)} onCancel={() => onCancel(match.id)} onToggleReschedule={() => onToggleReschedule(match.id)} onDateChange={onDateChange} onArenaChange={onArenaChange} onReschedule={(event) => onReschedule(event, match)} />)}</div>}</Card.Body></Card>;
}
