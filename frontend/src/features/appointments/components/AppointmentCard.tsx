import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Modal from 'react-bootstrap/Modal';
import { useState } from 'react';
import type { Appointment } from '../types/appointments.types';
import { SportIcon } from '../../../components/ui/SportIcon';
import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';

export function AppointmentCard({
  appointment,
  action,
  actionLabel,
  onDetails,
  disabled = false,
}: {
  appointment: Appointment;
  action?: () => void;
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
            onClick={action}
            disabled={disabled}
          >
            {actionLabel ?? 'Participar'}
          </Button>
        )}
      </Card.Body>
      {!onDetails && (
        <Modal
          show={showDetails}
          onHide={() => setShowDetails(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>{appointment.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>{appointment.description || 'Sem descrição adicional.'}</p>
            <dl className="mt-3 small">
              <dt>Esporte</dt>
              <dd>{appointment.sportName ?? 'Não informado'}</dd>
              <dt>Data e horário</dt>
              <dd>
                {scheduledAt.toLocaleString('pt-BR', {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
              </dd>
              <dt>Local</dt>
              <dd>{appointment.arenaAddress ?? 'Local a confirmar'}</dd>
              <dt>Participantes</dt>
              <dd>
                {appointment.players}
                {appointment.maxPlayers
                  ? ` de ${appointment.maxPlayers} vagas titulares`
                  : ''}
              </dd>
              <dt>Situação</dt>
              <dd>
                {appointment.status === 'scheduled'
                  ? 'Confirmado'
                  : appointment.status === 'in_progress'
                    ? 'Em andamento'
                    : appointment.status === 'finished'
                      ? 'Finalizado'
                      : 'Cancelado'}
              </dd>
              {appointment.distanceKm !== null && (
                <>
                  <dt>Distância</dt>
                  <dd>{appointment.distanceKm.toFixed(1)} km</dd>
                </>
              )}
              {appointment.participants.length > 0 && (
                <>
                  <dt>Atletas</dt>
                  <dd>
                    <div className="list-group rounded-3">
                      {appointment.participants.map((participant) => (
                        <div
                          className="list-group-item d-flex flex-wrap align-items-center gap-3 p-3"
                          key={participant.id}
                        >
                          <ProfileAvatar
                            name={participant.name}
                            image={participant.image}
                          />
                          <div className="d-flex flex-column gap-1 text-break me-auto">
                            <strong>{participant.name ?? 'Atleta'}</strong>
                            <span>
                              {participant.username
                                ? `@${participant.username}`
                                : participant.holder
                                  ? 'Titular'
                                  : 'Participante'}
                            </span>
                          </div>
                          {participant.holder && (
                            <span className="badge rounded-pill bg-success-subtle text-success-emphasis text-capitalize">
                              Titular
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </dd>
                </>
              )}
            </dl>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowDetails(false)}
            >
              Fechar
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Card>
  );
}
