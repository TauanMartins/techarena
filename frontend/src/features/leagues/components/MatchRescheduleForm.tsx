import type { SubmitEvent } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import type { LeagueArena } from '../types/leagues.types';
import type { Schedule } from '../../../shared/types';
import { localDate } from '../date';

export function MatchRescheduleForm({
  matchId,
  date,
  arenaId,
  arenas,
  schedules,
  saving,
  onDateChange,
  onArenaChange,
  onSubmit,
  onCancel,
}: {
  matchId: string;
  date: string;
  arenaId: string;
  arenas: LeagueArena[];
  schedules: Schedule[];
  saving: boolean;
  onDateChange: (value: string) => void;
  onArenaChange: (value: string) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <Form
      className="row g-2 mt-2"
      onSubmit={onSubmit}
    >
      <Form.Group
        className="col-md-4"
        controlId={`reschedule-date-${matchId}`}
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
        controlId={`reschedule-arena-${matchId}`}
      >
        <Form.Label className="small">Arena</Form.Label>
        <Form.Select
          value={arenaId}
          onChange={(event) => onArenaChange(event.target.value)}
          required
        >
          {arenas.map((arena) => (
            <option
              key={arena.id}
              value={arena.id}
            >
              {arena.address}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      <Form.Group
        className="col-md-4"
        controlId={`reschedule-time-${matchId}`}
      >
        <Form.Label className="small">Horário disponível</Form.Label>
        <Form.Select
          name="scheduleId"
          required
          defaultValue=""
        >
          <option
            value=""
            disabled
          >
            Selecione
          </option>
          {schedules.map((item) => (
            <option
              key={item.id}
              value={item.id}
            >
              {item.horary.slice(0, 5)}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      <div className="d-flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={saving || !schedules.length}
        >
          Salvar novo horário
        </Button>
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          onClick={onCancel}
        >
          Voltar
        </Button>
      </div>
    </Form>
  );
}
