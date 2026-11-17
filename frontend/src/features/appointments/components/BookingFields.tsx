import Form from 'react-bootstrap/Form';
import type { Arena, Schedule, Sport } from '../types/appointments.types';
import type { BookingFormInput } from '../schemas/booking.schema';

export function BookingFields({
  sports,
  lockedArena = false,
  availableArenas,
  slots,
  values,
  today,
  titlePrefix,
  onChange,
  errors,
}: {
  sports: Sport[];
  lockedArena?: boolean;
  availableArenas: Arena[];
  slots: Schedule[];
  today: string;
  values: BookingFormInput;
  titlePrefix: string;
  onChange: (name: keyof BookingFormInput, value: string) => void;
  errors: Partial<Record<keyof BookingFormInput, string>>;
}) {
  return (
    <>
      <div className="row">
        <Form.Group className="col-md-6 mb-3">
          <Form.Label htmlFor="booking-sport">Esporte</Form.Label>
          <Form.Select
            id="booking-sport"
            isInvalid={!!errors.sportId}
            value={values.sportId}
            onChange={(event) => {
              onChange('sportId', event.target.value);
              if (
                !lockedArena &&
                !availableArenas.some(
                  (arena) =>
                    arena.id === values.arenaId &&
                    arena.sportIds.includes(event.target.value),
                )
              )
                onChange('arenaId', '');
              onChange('scheduleId', '');
            }}
          >
            <option value="">Selecione uma modalidade</option>
            {sports.map((sport) => (
              <option
                key={sport.id}
                value={sport.id}
              >
                {sport.name}
              </option>
            ))}
          </Form.Select>
          <Form.Control.Feedback type="invalid">
            {errors.sportId}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="col-md-6 mb-3">
          <Form.Label htmlFor="booking-arena">Arena</Form.Label>
          <Form.Select
            id="booking-arena"
            isInvalid={!!errors.arenaId}
            value={values.arenaId}
            onChange={(event) => {
              onChange('arenaId', event.target.value);
              onChange('scheduleId', '');
            }}
            disabled={lockedArena || !values.sportId}
          >
            <option value="">Selecione uma arena</option>
            {availableArenas.map((arena) => (
              <option
                key={arena.id}
                value={arena.id}
              >
                {arena.address}
              </option>
            ))}
          </Form.Select>
          <Form.Control.Feedback type="invalid">
            {errors.arenaId}
          </Form.Control.Feedback>
          {lockedArena && (
            <Form.Text>
              A quadra está definida. São exibidas apenas modalidades
              compatíveis.
            </Form.Text>
          )}
        </Form.Group>
      </div>
      <div className="row">
        <Form.Group className="col-md-6 mb-3">
          <Form.Label htmlFor="booking-date">Data</Form.Label>
          <Form.Control
            id="booking-date"
            type="date"
            min={today}
            isInvalid={!!errors.date}
            value={values.date}
            onChange={(event) => {
              onChange('date', event.target.value);
              onChange('scheduleId', '');
            }}
          />
          <Form.Control.Feedback type="invalid">
            {errors.date}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="col-md-6 mb-3">
          <Form.Label htmlFor="booking-schedule">Horário disponível</Form.Label>
          <Form.Select
            id="booking-schedule"
            isInvalid={!!errors.scheduleId}
            value={values.scheduleId}
            onChange={(event) => onChange('scheduleId', event.target.value)}
            disabled={!slots.length}
          >
            <option value="">
              {slots.length
                ? 'Selecione um horário'
                : 'Sem horários para a seleção'}
            </option>
            {slots.map((slot) => (
              <option
                key={slot.id}
                value={slot.id}
              >
                {slot.horary}
              </option>
            ))}
          </Form.Select>
          <Form.Control.Feedback type="invalid">
            {errors.scheduleId}
          </Form.Control.Feedback>
        </Form.Group>
      </div>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="booking-title">Nome do evento</Form.Label>
        <Form.Control
          id="booking-title"
          isInvalid={!!errors.title}
          value={values.title}
          onChange={(event) => onChange('title', event.target.value)}
          placeholder={
            titlePrefix.startsWith('Torneio')
              ? 'Ex.: Torneio de vôlei'
              : 'Ex.: Futebol de sábado'
          }
        />
        <Form.Control.Feedback type="invalid">
          {errors.title}
        </Form.Control.Feedback>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="booking-description">Descrição</Form.Label>
        <Form.Control
          id="booking-description"
          as="textarea"
          rows={3}
          isInvalid={!!errors.description}
          value={values.description}
          onChange={(event) => onChange('description', event.target.value)}
          placeholder="Detalhes para quem quiser participar"
        />
        <Form.Control.Feedback type="invalid">
          {errors.description}
        </Form.Control.Feedback>
      </Form.Group>
      <Form.Group className="mb-4">
        <Form.Label htmlFor="booking-max-players">
          Limite de participantes (opcional)
        </Form.Label>
        <Form.Control
          id="booking-max-players"
          type="number"
          min={1}
          max={1000}
          isInvalid={!!errors.maxPlayers}
          value={values.maxPlayers}
          onChange={(event) => onChange('maxPlayers', event.target.value)}
        />
        <Form.Control.Feedback type="invalid">
          {errors.maxPlayers}
        </Form.Control.Feedback>
      </Form.Group>
    </>
  );
}
