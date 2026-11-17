import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { AppointmentCard } from '../features/appointments/components/AppointmentCard';
import { BookingModal } from '../features/appointments/components/BookingForm';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeading,
} from '../components/ui/Feedback';
import {
  useAppointments,
  useJoinAppointment,
} from '../features/appointments/api/appointments.api';

export function AppointmentsPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const token = session!.access_token;
  const userId = session!.user.id;
  const [notice, setNotice] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const appointmentsQuery = useAppointments(token, userId, {
    page: 1,
    limit: 30,
    orderByTime: 'future',
    preferSports: false,
  });
  const appointments = appointmentsQuery.data?.items ?? [];
  const joinMutation = useJoinAppointment(token, userId, () =>
    setNotice('Você entrou no agendamento.'),
  );

  return (
    <>
      <PageHeading
        eyebrow="PARTIDAS ABERTAS"
        title="Agendamentos"
        description="Encontre uma partida na sua modalidade e participe."
        action={
          <Button onClick={() => setShowBooking(true)}>
            <i className="bi bi-plus-lg me-2" />
            Criar agendamento
          </Button>
        }
      />
      {notice && (
        <div
          className="alert alert-success d-flex align-items-center gap-2"
          role="status"
        >
          <i className="bi bi-check-circle-fill" />
          {notice}
        </div>
      )}
      {appointmentsQuery.isPending && (
        <LoadingState label="Carregando agendamentos..." />
      )}
      {appointmentsQuery.error && (
        <ErrorState
          message={
            appointmentsQuery.error instanceof Error
              ? appointmentsQuery.error.message
              : 'Não foi possível carregar os agendamentos.'
          }
        />
      )}
      {joinMutation.error && (
        <ErrorState
          message={
            joinMutation.error instanceof Error
              ? joinMutation.error.message
              : 'Não foi possível entrar no agendamento.'
          }
        />
      )}
      {!appointmentsQuery.isPending &&
        !appointmentsQuery.error &&
        appointments.length === 0 && (
          <EmptyState
            icon="bi-calendar2-x"
            title="Nenhum agendamento encontrado"
            description="Seja a primeira pessoa a organizar uma partida."
          />
        )}
      {!appointmentsQuery.isPending && appointments.length > 0 && (
        <div className="row g-3">
          {appointments.map((appointment) => {
            const isOrganizer = appointment.organizerId === session?.user.id;
            const isCurrentMutation =
              (typeof joinMutation.variables === 'string'
                ? joinMutation.variables
                : joinMutation.variables?.appointmentId) === appointment.id;
            const joined =
              isOrganizer ||
              appointment.isInside ||
              (isCurrentMutation && joinMutation.isSuccess);
            return (
              <div
                className="col-md-6 col-xl-4"
                key={appointment.id}
              >
                <AppointmentCard
                  appointment={appointment}
                  token={session!.access_token}
                  joined={joined}
                  error={
                    isCurrentMutation ? joinMutation.error?.message : undefined
                  }
                  action={
                    joined
                      ? () => navigate(`/chat/appointment/${appointment.id}`)
                      : (holder = true) =>
                          joinMutation.mutate({
                            appointmentId: appointment.id,
                            holder,
                          })
                  }
                  actionLabel={
                    joined
                      ? 'Ir para conversa'
                      : joinMutation.isPending &&
                          (typeof joinMutation.variables === 'string'
                            ? joinMutation.variables
                            : joinMutation.variables?.appointmentId) ===
                            appointment.id
                        ? 'Entrando...'
                        : 'Participar'
                  }
                  disabled={
                    !isOrganizer &&
                    !appointment.isInside &&
                    joinMutation.isPending &&
                    (typeof joinMutation.variables === 'string'
                      ? joinMutation.variables
                      : joinMutation.variables?.appointmentId) ===
                      appointment.id
                  }
                />
              </div>
            );
          })}
        </div>
      )}
      <BookingModal
        show={showBooking}
        onHide={() => setShowBooking(false)}
        onCreated={() => void appointmentsQuery.refetch()}
      />
    </>
  );
}
