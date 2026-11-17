import { Link } from 'react-router-dom';
import { ErrorState } from '../../../components/ui/Feedback';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { useState } from 'react';
import type { Appointment } from '../types/appointments.types';
import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';
import { AppointmentMaterials } from './AppointmentMaterials';
import { useCurrentTimestamp } from '../../../shared/clock';
export function AppointmentDetailsModal({
  appointment,
  show,
  onHide,
  action,
  disabled = false,
  token,
  error,
  joined = appointment.isInside,
}: {
  appointment: Appointment;
  show: boolean;
  onHide: () => void;
  action?: (holder?: boolean) => void;
  disabled?: boolean;
  token?: string;
  error?: string;
  joined?: boolean;
}) {
  const [holder, setHolder] = useState(true);
  const now = useCurrentTimestamp();
  const scheduledAt = new Date(appointment.scheduledAt);
  const closed = scheduledAt.getTime() <= now;
  const full =
    appointment.maxPlayers !== null &&
    appointment.startingPlayers >= appointment.maxPlayers;
  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>{appointment.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <ErrorState message={error} />}
        {appointment.arenaImage && (
          <img
            className="w-100 rounded-3 mb-3 object-fit-cover"
            height={200}
            src={appointment.arenaImage}
            alt={`Local de ${appointment.title}`}
          />
        )}

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
          <dd>
            {appointment.arenaAddress ?? 'Local a confirmar'}
            {appointment.arenaId && (
              <Link
                className="d-block"
                to={`/?arenaId=${encodeURIComponent(appointment.arenaId)}`}
                onClick={onHide}
              >
                Ver arena no mapa
              </Link>
            )}
          </dd>
          <dt>Participantes</dt>
          <dd>
            {appointment.players} pessoas · {appointment.startingPlayers}
            {appointment.maxPlayers !== null
              ? `/${appointment.maxPlayers}`
              : ''}{' '}
            titulares
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
        {token && appointment.sportId && show && (
          <AppointmentMaterials
            token={token}
            sportId={appointment.sportId}
          />
        )}
        {action && !joined && appointment.status === 'scheduled' && !closed && (
          <fieldset className="border rounded-3 p-3 mt-3">
            <legend className="float-none w-auto px-2 fs-6">
              Como você quer participar?
            </legend>
            <Form.Check
              type="radio"
              name={`participation-${appointment.id}`}
              id={`holder-${appointment.id}`}
              label={
                full ? 'Titular — vagas preenchidas' : 'Entrar como titular'
              }
              checked={holder && !full}
              disabled={full}
              onChange={() => setHolder(true)}
            />
            <Form.Check
              type="radio"
              name={`participation-${appointment.id}`}
              id={`reserve-${appointment.id}`}
              label="Entrar como reserva"
              checked={!holder || full}
              onChange={() => setHolder(false)}
            />
            <p className="small text-body-secondary mt-2 mb-0">
              Sua participação ficará visível para o grupo. Depois de entrar,
              você poderá conversar com os demais atletas.
            </p>
          </fieldset>
        )}
      </Modal.Body>
      <Modal.Footer>
        {action &&
          (joined ? (
            <Button onClick={() => action()}>Ir para conversa</Button>
          ) : (
            appointment.status === 'scheduled' &&
            !closed && (
              <Button
                disabled={disabled}
                onClick={() => action(full ? false : holder)}
              >
                Confirmar participação
              </Button>
            )
          ))}

        <Button
          variant="secondary"
          onClick={onHide}
        >
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
