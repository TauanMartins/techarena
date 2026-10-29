import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import type { Appointment } from '../shared/types';
import { SportIcon } from './SportIcon';

export function AppointmentCard({
  appointment,
  action,
  actionLabel,
  disabled = false,
}: {
  appointment: Appointment;
  action?: () => void;
  actionLabel?: string;
  disabled?: boolean;
}) {
  const scheduledAt = new Date(appointment.scheduledAt);
  return (
    <Card className="event-card h-100">
      <Card.Body>
        <div className="event-card-topline">
          <span className="sport-tag">
            <SportIcon name={appointment.sportName ?? ''} />
            {appointment.sportName ?? 'Esporte'}
          </span>
          <span className="event-status">{appointment.status === 'scheduled' ? 'Confirmado' : appointment.status}</span>
        </div>
        <h3>{appointment.title}</h3>
        <p className="event-description">{appointment.description || 'Encontre pessoas para jogar e pratique seu esporte favorito.'}</p>
        <div className="event-meta">
          <span><i className="bi bi-calendar3" />{scheduledAt.toLocaleDateString('pt-BR')}</span>
          <span><i className="bi bi-clock" />{scheduledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          <span><i className="bi bi-geo-alt" />{appointment.arenaAddress ?? 'Local a confirmar'}</span>
          <span><i className="bi bi-people" />{appointment.players}{appointment.maxPlayers ? ` / ${appointment.maxPlayers}` : ''} atletas</span>
        </div>
        {action && (
          <Button className="w-100 mt-3" variant="outline-primary" onClick={action} disabled={disabled}>
            {actionLabel ?? 'Participar'}
          </Button>
        )}
      </Card.Body>
    </Card>
  );
}
