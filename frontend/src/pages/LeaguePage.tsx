import { useCallback, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import { useAuth } from '../auth/AuthProvider';
import { BookingForm } from '../components/BookingForm';
import { EmptyState, ErrorState, LoadingState, PageHeading } from '../components/Feedback';
import { api } from '../shared/api';
import type { AppointmentMembership } from '../shared/types';

export function LeaguePage() {
  const { session } = useAuth();
  const token = session!.access_token;
  const [appointments, setAppointments] = useState<AppointmentMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadLeagueEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const appointmentPage = await api.listMyAppointments(token);
      setAppointments(appointmentPage.items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os eventos de liga.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void loadLeagueEvents(); }, [loadLeagueEvents]);

  return (
    <>
      <PageHeading
        eyebrow="COMPETIÇÃO E COMUNIDADE"
        title="Ligas e torneios"
        description="Organize eventos nas arenas sinalizadas para liga no catálogo atual."
        action={<Button onClick={() => setShowForm((open) => !open)}><i className="bi bi-plus-lg me-2" />{showForm ? 'Fechar' : 'Criar evento'}</Button>}
      />
      <Card className="content-card mb-4 league-info">
        <Card.Body>
          <div className="league-info-icon"><i className="bi bi-info-lg" /></div>
          <p>
            A API atual não oferece rotas para as entidades <code>league</code> e
            <code> league_team</code>. O fluxo antigo de liga criava eventos usando
            esportes, arenas, horários e agendamentos; esta tela mantém esse fluxo como
            eventos de torneio e os lista a partir dos seus agendamentos. Nenhum dado é
            enviado para rotas de liga inexistentes.
          </p>
        </Card.Body>
      </Card>
      {showForm && (
        <Card className="content-card mb-4">
          <Card.Body>
            <div className="section-title-row"><div><span className="eyebrow">NOVO EVENTO</span><h2>Organize uma disputa</h2></div></div>
            <BookingForm titlePrefix="Torneio de" onCreated={() => { setShowForm(false); void loadLeagueEvents(); }} />
          </Card.Body>
        </Card>
      )}
      <div className="section-title-row">
        <div><span className="eyebrow">AGENDA COMPETITIVA</span><h2>Próximos eventos</h2></div>
      </div>
      {loading && <LoadingState label="Carregando eventos..." />}
      {error && <ErrorState message={error} />}
      {!loading && !error && !appointments.length && (
        <EmptyState
          icon="bi-trophy"
          title="Ainda não há eventos na sua agenda"
          description="Crie um evento de torneio ou participe de uma partida para que ela apareça aqui."
        />
      )}
      {!loading && appointments.length > 0 && (
        <div className="row g-3">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="col-md-6 col-xl-4">
              <Card className="event-card h-100">
                <Card.Body>
                <span className="sport-tag"><i className="bi bi-trophy" /> Agendamento</span>
                  <h3 className="mt-3">{appointment.title}</h3>
                  <p>{appointment.description || 'Evento esportivo'}</p>
                  <div className="event-meta mt-3">
                    <span><i className="bi bi-calendar3" />{new Date(appointment.scheduledAt).toLocaleString('pt-BR')}</span>
                    <span><i className="bi bi-person-check" />{appointment.isOrganizer ? 'Organizador' : 'Participante'}</span>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
