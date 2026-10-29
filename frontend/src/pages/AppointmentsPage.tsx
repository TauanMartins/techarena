import { useCallback, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { useAuth } from '../auth/AuthProvider';
import { AppointmentCard } from '../components/AppointmentCard';
import { BookingModal } from '../components/BookingForm';
import { EmptyState, ErrorState, LoadingState, PageHeading } from '../components/Feedback';
import { api } from '../shared/api';
import type { Appointment } from '../shared/types';

export function AppointmentsPage() {
  const { session } = useAuth();
  const token = session!.access_token;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.listAppointments(token, {
        page: 1,
        limit: 30,
        orderByTime: 'future',
        preferSports: false,
      });
      setAppointments(result.items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os agendamentos.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void loadAppointments(); }, [loadAppointments]);

  async function join(appointment: Appointment) {
    setJoining(appointment.id);
    setNotice(null);
    try {
      await api.joinAppointment(token, appointment.id);
      setNotice('Você entrou no agendamento.');
      await loadAppointments();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível entrar no agendamento.');
    } finally {
      setJoining(null);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="PARTIDAS ABERTAS"
        title="Agendamentos"
        description="Encontre uma partida na sua modalidade e participe."
        action={<Button onClick={() => setShowBooking(true)}><i className="bi bi-plus-lg me-2" />Criar agendamento</Button>}
      />
      {notice && <div className="inline-notice" role="status"><i className="bi bi-check-circle-fill" />{notice}</div>}
      {loading && <LoadingState label="Carregando agendamentos..." />}
      {error && <ErrorState message={error} />}
      {!loading && !error && appointments.length === 0 && (
        <EmptyState icon="bi-calendar2-x" title="Nenhum agendamento encontrado" description="Seja a primeira pessoa a organizar uma partida." />
      )}
      {!loading && appointments.length > 0 && (
        <div className="row g-3">
          {appointments.map((appointment) => {
            const isOrganizer = appointment.organizerId === session?.user.id;
            return (
              <div className="col-md-6 col-xl-4" key={appointment.id}>
                <AppointmentCard
                  appointment={appointment}
                  action={isOrganizer ? undefined : () => void join(appointment)}
                  actionLabel={joining === appointment.id ? 'Entrando...' : 'Participar'}
                  disabled={joining === appointment.id}
                />
              </div>
            );
          })}
        </div>
      )}
      <BookingModal show={showBooking} onHide={() => setShowBooking(false)} onCreated={() => void loadAppointments()} />
    </>
  );
}
