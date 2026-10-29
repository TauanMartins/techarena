import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { AppointmentCard } from '../components/AppointmentCard';
import { BookingModal } from '../components/BookingForm';
import { EmptyState, ErrorState, LoadingState, PageHeading } from '../components/Feedback';
import { api } from '../shared/api';
import { queryKeys } from '../shared/queryClient';

export function AppointmentsPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const token = session!.access_token;
  const userId = session!.user.id;
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const appointmentsQuery = useQuery({
    queryKey: queryKeys.appointments(userId, {
      page: 1,
      limit: 30,
      orderByTime: 'future',
      preferSports: false,
    }),
    queryFn: () =>
      api.listAppointments(token, {
        page: 1,
        limit: 30,
        orderByTime: 'future',
        preferSports: false,
      }),
  });
  const appointments = appointmentsQuery.data?.items ?? [];
  const joinMutation = useMutation({
    mutationFn: (appointmentId: string) =>
      api.joinAppointment(token, appointmentId),
    onSuccess: async () => {
      setNotice('Você entrou no agendamento.');
      await queryClient.invalidateQueries({
        queryKey: ['appointments', userId],
      });
    },
  });

  return (
    <>
      <PageHeading
        eyebrow="PARTIDAS ABERTAS"
        title="Agendamentos"
        description="Encontre uma partida na sua modalidade e participe."
        action={<Button onClick={() => setShowBooking(true)}><i className="bi bi-plus-lg me-2" />Criar agendamento</Button>}
      />
      {notice && <div className="inline-notice" role="status"><i className="bi bi-check-circle-fill" />{notice}</div>}
      {appointmentsQuery.isPending && <LoadingState label="Carregando agendamentos..." />}
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
      {!appointmentsQuery.isPending && !appointmentsQuery.error && appointments.length === 0 && (
        <EmptyState icon="bi-calendar2-x" title="Nenhum agendamento encontrado" description="Seja a primeira pessoa a organizar uma partida." />
      )}
      {!appointmentsQuery.isPending && appointments.length > 0 && (
        <div className="row g-3">
          {appointments.map((appointment) => {
            const isOrganizer = appointment.organizerId === session?.user.id;
            return (
              <div className="col-md-6 col-xl-4" key={appointment.id}>
                <AppointmentCard
                  appointment={appointment}
                  action={isOrganizer || appointment.isInside
                    ? () => navigate(`/chat/appointment/${appointment.id}`)
                    : () => joinMutation.mutate(appointment.id)}
                  actionLabel={isOrganizer || appointment.isInside
                    ? 'Ir para conversa'
                    : joinMutation.isPending && joinMutation.variables === appointment.id ? 'Entrando...' : 'Participar'}
                  disabled={!isOrganizer && !appointment.isInside && joinMutation.isPending && joinMutation.variables === appointment.id}
                />
              </div>
            );
          })}
        </div>
      )}
      <BookingModal show={showBooking} onHide={() => setShowBooking(false)} onCreated={() => void appointmentsQuery.refetch()} />
    </>
  );
}
