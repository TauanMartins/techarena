import type { FormEvent } from "react";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import type { LeagueArena, LeagueMatch, Schedule } from "../../../shared/types";
import { localDate } from "../date";

interface LeagueMatchCardProps {
  match: LeagueMatch;
  canRecordResult: boolean;
  canManage: boolean;
  isRescheduling: boolean;
  date: string;
  arenas: LeagueArena[];
  arenaId: string;
  availability: Schedule[];
  scores: { home: string; away: string };
  saving: boolean;
  onScoreChange: (side: "home" | "away", value: string) => void;
  onSaveResult: () => void;
  onCancel: () => void;
  onToggleReschedule: () => void;
  onDateChange: (date: string) => void;
  onArenaChange: (id: string) => void;
  onReschedule: (event: FormEvent<HTMLFormElement>) => void;
}

export function LeagueMatchCard({
  match,
  canRecordResult,
  canManage,
  isRescheduling,
  date,
  arenas,
  arenaId,
  availability,
  scores,
  saving,
  onScoreChange,
  onSaveResult,
  onCancel,
  onToggleReschedule,
  onDateChange,
  onArenaChange,
  onReschedule,
}: LeagueMatchCardProps) {
  const isFinished = match.status === "finished";
  const isCanceled = match.status === "canceled";
  const canSubmitScore = canRecordResult && match.resultAllowed && !isCanceled;
  const canReschedule =
    canManage &&
    match.status === "scheduled" &&
    new Date(match.scheduledAt) > new Date();
  const statusLabel = isFinished
    ? "Concluída"
    : isCanceled
      ? "Cancelada"
      : canSubmitScore
        ? "Resultado pendente"
        : match.status === "in_progress"
          ? "Em andamento"
          : "Agendada";

  return (
    <Card>
      <Card.Body>
        <div className="d-flex justify-content-between gap-3">
          <div>
            <div className="fw-semibold">
              {match.homeTeam.name} <span className="text-secondary">x</span>{" "}
              {match.awayTeam.name}
            </div>
            <div className="small text-secondary">
              {new Date(match.scheduledAt).toLocaleString("pt-BR")}
              {match.arenaAddress ? ` · ${match.arenaAddress}` : ""}
            </div>
            <div className="small text-secondary">
              {match.phase === "knockout"
                ? `Mata-mata · rodada ${match.roundNumber}`
                : match.phase === "group"
                  ? match.groupNumber
                    ? `Grupos · grupo ${match.groupNumber} · rodada ${match.roundNumber}`
                    : `Pontos corridos · rodada ${match.roundNumber}`
                  : "Partida avulsa"}
            </div>
          </div>
          <Badge
            bg={
              isFinished
                ? "success"
                : isCanceled
                  ? "danger"
                  : canSubmitScore
                    ? "warning"
                    : "secondary"
            }
          >
            {statusLabel}
          </Badge>
        </div>
        {match.result && (
          <p className="mt-2 mb-0 fw-semibold">
            Placar: {match.result.homeScore} x {match.result.awayScore}
          </p>
        )}
        {canSubmitScore && (
          <div className="d-flex align-items-end gap-2 mt-3">
            <Form.Group controlId={`home-score-${match.id}`}>
              <Form.Label className="small">{match.homeTeam.name}</Form.Label>
              <Form.Control
                type="number"
                min={0}
                step={1}
                aria-label={`Placar de ${match.homeTeam.name}`}
                value={scores.home}
                onChange={(event) => onScoreChange("home", event.target.value)}
              />
            </Form.Group>
            <span className="pb-2">x</span>
            <Form.Group controlId={`away-score-${match.id}`}>
              <Form.Label className="small">{match.awayTeam.name}</Form.Label>
              <Form.Control
                type="number"
                min={0}
                step={1}
                aria-label={`Placar de ${match.awayTeam.name}`}
                value={scores.away}
                onChange={(event) => onScoreChange("away", event.target.value)}
              />
            </Form.Group>
            <Button disabled={saving} onClick={onSaveResult}>
              {match.result ? "Atualizar resultado" : "Registrar resultado"}
            </Button>
          </div>
        )}
        {canReschedule && !isRescheduling && (
          <div className="d-flex gap-2 mt-3">
            <Button
              variant="outline-primary"
              size="sm"
              disabled={saving}
              onClick={onToggleReschedule}
            >
              Reagendar
            </Button>
            {match.phase === "manual" && (
              <Button
                variant="outline-danger"
                size="sm"
                disabled={saving}
                onClick={onCancel}
              >
                Cancelar partida
              </Button>
            )}
          </div>
        )}
        {isRescheduling && (
          <Form className="row g-2 mt-2" onSubmit={onReschedule}>
            <Form.Group
              className="col-md-4"
              controlId={`reschedule-date-${match.id}`}
            >
              <Form.Label className="small">Nova data</Form.Label>
              <Form.Control
                type="date"
                min={localDate()}
                value={date}
                onChange={(event) => onDateChange(event.target.value)}
                required
              />
            </Form.Group>
            <Form.Group
              className="col-md-4"
              controlId={`reschedule-arena-${match.id}`}
            >
              <Form.Label className="small">Arena</Form.Label>
              <Form.Select
                value={arenaId}
                onChange={(event) => onArenaChange(event.target.value)}
                required
              >
                {arenas.map((arena) => (
                  <option key={arena.id} value={arena.id}>
                    {arena.address}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group
              className="col-md-4"
              controlId={`reschedule-time-${match.id}`}
            >
              <Form.Label className="small">Horário disponível</Form.Label>
              <Form.Select name="scheduleId" required defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                {availability.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.horary.slice(0, 5)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <div className="d-flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={saving || availability.length === 0}
              >
                Salvar novo horário
              </Button>
              <Button
                type="button"
                variant="outline-secondary"
                size="sm"
                onClick={onToggleReschedule}
              >
                Voltar
              </Button>
            </div>
          </Form>
        )}
      </Card.Body>
    </Card>
  );
}
