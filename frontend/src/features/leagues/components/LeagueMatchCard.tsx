import type { SubmitEvent } from 'react';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import type { LeagueArena, LeagueMatch, Schedule } from '../../../shared/types';
import { MatchResultFields } from './MatchResultFields';
import { MatchRescheduleForm } from './MatchRescheduleForm';
import { useCurrentTimestamp } from '../../../shared/clock';

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
  onScoreChange: (side: 'home' | 'away', value: string) => void;
  onSaveResult: () => void;
  onCancel: () => void;
  onToggleReschedule: () => void;
  onDateChange: (date: string) => void;
  onArenaChange: (id: string) => void;
  onReschedule: (event: SubmitEvent<HTMLFormElement>) => void;
}

export function LeagueMatchCard(props: LeagueMatchCardProps) {
  const now = useCurrentTimestamp();
  const {
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
  } = props;
  const finished = match.status === 'finished';
  const canceled = match.status === 'canceled';
  const canScore = canRecordResult && match.resultAllowed && !canceled;
  const canReschedule =
    canManage &&
    match.status === 'scheduled' &&
    Date.parse(match.scheduledAt) > now;
  const statusLabel = finished
    ? 'Concluída'
    : canceled
      ? 'Cancelada'
      : canScore
        ? 'Resultado pendente'
        : match.status === 'in_progress'
          ? 'Em andamento'
          : 'Agendada';
  const phase =
    match.phase === 'knockout'
      ? `Mata-mata · rodada ${match.roundNumber}`
      : match.phase === 'group'
        ? match.groupNumber
          ? `Grupos · grupo ${match.groupNumber} · rodada ${match.roundNumber}`
          : `Pontos corridos · rodada ${match.roundNumber}`
        : 'Partida avulsa';
  return (
    <Card>
      <Card.Body>
        <div className="d-flex justify-content-between gap-3">
          <div>
            <div className="fw-semibold">
              {match.homeTeam.name} <span className="text-secondary">x</span>{' '}
              {match.awayTeam.name}
            </div>
            <div className="small text-secondary">
              {new Date(match.scheduledAt).toLocaleString('pt-BR')}
              {match.arenaAddress ? ` · ${match.arenaAddress}` : ''}
            </div>
            <div className="small text-secondary">{phase}</div>
          </div>
          <Badge
            bg={
              finished
                ? 'success'
                : canceled
                  ? 'danger'
                  : canScore
                    ? 'warning'
                    : 'secondary'
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
        {canScore && (
          <MatchResultFields
            matchId={match.id}
            homeName={match.homeTeam.name}
            awayName={match.awayTeam.name}
            scores={scores}
            saving={saving}
            hasResult={Boolean(match.result)}
            onChange={onScoreChange}
            onSave={onSaveResult}
          />
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
            {match.phase === 'manual' && (
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
          <MatchRescheduleForm
            matchId={match.id}
            date={date}
            arenaId={arenaId}
            arenas={arenas}
            schedules={availability}
            saving={saving}
            onDateChange={onDateChange}
            onArenaChange={onArenaChange}
            onSubmit={onReschedule}
            onCancel={onToggleReschedule}
          />
        )}
      </Card.Body>
    </Card>
  );
}
