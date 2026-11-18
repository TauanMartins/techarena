import Form from 'react-bootstrap/Form';
import type { Schedule, Sport } from '../types/appointments.types';
import type { BookingFormInput } from '../schemas/booking.schema';

export function BookingFields({
  sports,
  slots,
  values,
  today,
  titlePrefix,
  onChange,
  errors,
}: {
  sports: Sport[];
  slots: Schedule[];
  today: string;
  values: BookingFormInput;
  titlePrefix: string;
  onChange: (name: keyof BookingFormInput, value: string) => void;
  errors: Partial<Record<keyof BookingFormInput, string>>;
}) {
  return (
    <>
      <section
        className="border rounded-3 p-3 mb-2"
        aria-label="Esporte e horário"
      >
        <h3 className="h6 mb-3">Esporte e horário</h3>
        <div className="row">
          <Form.Group className="col-md-6 mb-3">
            <Form.Label htmlFor="booking-sport">Esporte</Form.Label>
            <Form.Select
              id="booking-sport"
              isInvalid={!!errors.sportId}
              value={values.sportId}
              disabled={!values.arenaId}
              onChange={(event) => {
                onChange('sportId', event.target.value);
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
            <Form.Label htmlFor="booking-schedule">
              Horário disponível
            </Form.Label>
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
                  {slot.horary.slice(0, 5)}
                </option>
              ))}
            </Form.Select>
            <Form.Text>Horário de Brasília (UTC−3).</Form.Text>
            <Form.Control.Feedback type="invalid">
              {errors.scheduleId}
            </Form.Control.Feedback>
          </Form.Group>
        </div>
      </section>
      <section
        className="border rounded-3 p-3 mb-2"
        aria-label="Detalhes do evento"
      >
        <h3 className="h6 mb-3">Detalhes do evento</h3>
        <Form.Group className="mb-3">
          <Form.Label htmlFor="booking-title">
            Nome do evento (opcional)
          </Form.Label>
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
          <Form.Label htmlFor="booking-description">
            Descrição (opcional)
          </Form.Label>
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
      </section>
    </>
  );
}
