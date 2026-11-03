import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Modal from 'react-bootstrap/Modal';
import { useState } from 'react';
import type { Appointment } from '../types/appointments.types';
import { SportIcon } from '../../../components/SportIcon';
import { ProfileAvatar } from '../../../components/ProfileAvatar';

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
    <Card className="event-card h-100">
      <Card.Body>
        {appointment.arenaImage && (
          <Card.Img
            className="event-card-image"
            variant="top"
            src={appointment.arenaImage}
            alt={`Arena de ${appointment.title}`}
          />
        )}
        <div className="event-card-topline">
          <span className="sport-tag">
            <SportIcon name={appointment.sportName ?? ''} />
            {appointment.sportName ?? 'Esporte'}
          </span>
          <span className="event-status">
            {appointment.status === 'scheduled'
              ? 'Confirmado'
              : appointment.status}
          </span>
        </div>
        <h3>{appointment.title}</h3>
        <p className="event-description">
          {appointment.description ||
            'Encontre pessoas para jogar e pratique seu esporte favorito.'}
        </p>
        <div className="event-meta">
          <span>
            <i className="bi bi-calendar3" />
            {scheduledAt.toLocaleDateString('pt-BR')}
          </span>
          <span>
            <i className="bi bi-clock" />
            {scheduledAt.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span>
            <i className="bi bi-geo-alt" />
            {appointment.arenaAddress ?? 'Local a confirmar'}
          </span>
          <span>
            <i className="bi bi-people" />
            {appointment.players} participantes
          </span>
          {appointment.maxPlayers !== null && (
            <span>
              <i className="bi bi-person-fill-check" />
              {appointment.startingPlayers}/{appointment.maxPlayers} vagas
              titulares
            </span>
          )}
          {appointment.distanceKm !== null && (
            <span>
              <i className="bi bi-signpost-2" />
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
        <Modal show={showDetails} onHide={() => setShowDetails(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>{appointment.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>{appointment.description || 'Sem descrição adicional.'}</p>
            <dl className="appointment-details">
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
                    <div className="people-list">
                      {appointment.participants.map((participant) => (
                        <div className="person-row" key={participant.id}>
                          <ProfileAvatar
                            name={participant.name}
                            image={participant.image}
                          />
                          <div className="person-info">
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
                            <span className="team-role">Titular</span>
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
            <Button variant="secondary" onClick={() => setShowDetails(false)}>
              Fechar
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Card>
  );
}
