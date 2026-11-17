import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import { useState } from 'react';
import type { Appointment } from '../types/appointments.types';
import { SportIcon } from '../../../components/ui/SportIcon';
import { AppointmentDetailsModal } from './AppointmentDetailsModal';

export function AppointmentCard({
  appointment,
  action,
  actionLabel,
  onDetails,
  disabled = false,
  token,
  error,
  joined = appointment.isInside,
}: {
  appointment: Appointment;
  action?: (holder?: boolean) => void;
  token?: string;
  error?: string;
  joined?: boolean;
  actionLabel?: string;
  onDetails?: () => void;
  disabled?: boolean;
}) {
  const scheduledAt = new Date(appointment.scheduledAt);
  const [showDetails, setShowDetails] = useState(false);
  return (
    <Card className="border rounded-4 shadow-sm h-100">
      <Card.Body>
        {appointment.arenaImage && (
          <Card.Img
            height={170}
            className="w-100 object-fit-cover rounded-3 mb-3"
            variant="top"
            src={appointment.arenaImage}
            alt={`Arena de ${appointment.title}`}
          />
        )}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span className="d-inline-flex align-items-center gap-2 small fw-semibold text-body">
            <SportIcon name={appointment.sportName ?? ''} />
            {appointment.sportName ?? 'Esporte'}
          </span>
          <span className="badge rounded-pill bg-success-subtle text-success-emphasis text-capitalize">
            {appointment.status === 'scheduled'
              ? 'Confirmado'
              : appointment.status}
          </span>
        </div>
        <h3 className="h5 fw-bold mt-3 mb-2">{appointment.title}</h3>
        <p className="text-body-secondary mb-0">
          {appointment.description ||
            'Encontre pessoas para jogar e pratique seu esporte favorito.'}
        </p>
        <div className="d-flex flex-column gap-2 mt-3 small text-body-secondary">
          <span>
            <i className="me-2 bi bi-calendar3" />
            {scheduledAt.toLocaleDateString('pt-BR')}
          </span>
          <span>
            <i className="me-2 bi bi-clock" />
            {scheduledAt.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span>
            <i className="me-2 bi bi-geo-alt" />
            {appointment.arenaAddress ?? 'Local a confirmar'}
          </span>
          <span>
            <i className="me-2 bi bi-people" />
            {appointment.players} participantes
          </span>
          {appointment.maxPlayers !== null && (
            <span>
              <i className="me-2 bi bi-person-fill-check" />
              {appointment.startingPlayers}/{appointment.maxPlayers} vagas
              titulares
            </span>
          )}
          {appointment.distanceKm !== null && (
            <span>
              <i className="me-2 bi bi-signpost-2" />
              {appointment.distanceKm.toFixed(1)} km
            </span>
          )}
        </div>
        <Button
          className="w-100 mt-3"
          variant="outline-secondary"
          onClick={onDetails ?? (() => setShowDetails(true))}
        >
          Ver detalhes
        </Button>
        {action && (
          <Button
            className="w-100 mt-2"
            variant="outline-primary"
            onClick={() =>
              !onDetails && !joined ? setShowDetails(true) : action()
            }
            disabled={disabled}
          >
            {actionLabel ?? 'Participar'}
          </Button>
        )}
      </Card.Body>
      {!onDetails && (
        <AppointmentDetailsModal
          appointment={appointment}
          show={showDetails}
          onHide={() => setShowDetails(false)}
          action={action}
          disabled={disabled}
          token={token}
          joined={joined}
          error={error}
        />
      )}
    </Card>
  );
}
