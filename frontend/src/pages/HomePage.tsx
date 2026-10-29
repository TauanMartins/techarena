import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import { useAuth } from '../auth/AuthProvider';
import { AppointmentCard } from '../components/AppointmentCard';
import { BookingModal } from '../components/BookingForm';
import { EmptyState, ErrorState, LoadingState, PageHeading } from '../components/Feedback';
import { api } from '../shared/api';
import type { Appointment, FavoriteSports } from '../shared/types';
import { SportIcon } from '../components/SportIcon';

export function HomePage() {
  const { session, profile } = useAuth();
  const token = session!.access_token;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [favorites, setFavorites] = useState<FavoriteSports | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [appointmentPage, favoriteSports] = await Promise.all([
        api.listAppointments(token, { page: 1, limit: 6, orderByTime: 'future', preferSports: true }),
        api.getFavoriteSports(token),
      ]);
      setAppointments(appointmentPage.items);
      setFavorites(favoriteSports);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar sua página inicial.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  return (
    <>
      <PageHeading
        eyebrow="SEU ESPORTE, SUA COMUNIDADE"
        title={`Olá, ${profile?.name?.split(' ')[0] ?? 'atleta'}!`}
        description="Descubra uma partida, encontre seu time e coloque o jogo na agenda."
        action={<Button onClick={() => setShowBooking(true)}><i className="bi bi-plus-lg me-2" />Criar agendamento</Button>}
      />
      <section className="welcome-banner">
        <div>
          <span className="banner-kicker">HORA DE ENTRAR EM CAMPO</span>
          <h2>O próximo jogo pode começar com você.</h2>
          <p>Encontre atletas perto de você e transforme qualquer dia em dia de jogo.</p>
          <Link to="/agendamentos" className="btn btn-light">Explorar agendamentos <i className="bi bi-arrow-up-right ms-2" /></Link>
        </div>
        <div className="banner-mark" aria-hidden="true"><i className="bi bi-trophy-fill" /></div>
      </section>

      <section className="content-section">
        <div className="section-title-row">
          <div><span className="eyebrow">SELEÇÃO PERSONALIZADA</span><h2>Seus esportes favoritos</h2></div>
          <Link to="/configuracoes" className="text-link">Editar favoritos <i className="bi bi-arrow-right" /></Link>
        </div>
        {favorites && (
          favorites.items.length ? (
            <div className="favorite-grid">
              {favorites.items.map((sport) => (
                <Card className="favorite-card" key={sport.id}>
                  <Card.Body>
                    <span className="sport-icon"><SportIcon name={sport.name} /></span>
                    <strong>{sport.name}</strong>
                  </Card.Body>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="content-card">
              <Card.Body className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                <span>Escolha até {favorites.maxFavorites} esportes para personalizar suas recomendações.</span>
                <Link to="/configuracoes" className="btn btn-outline-primary">Escolher modalidades</Link>
              </Card.Body>
            </Card>
          )
        )}
      </section>

      <section className="content-section">
        <div className="section-title-row">
          <div><span className="eyebrow">VAMOS JOGAR?</span><h2>Próximos agendamentos</h2></div>
          <Link to="/agendamentos" className="text-link">Ver todos <i className="bi bi-arrow-right" /></Link>
        </div>
        {loading && <LoadingState label="Buscando partidas..." />}
        {error && <ErrorState message={error} />}
        {!loading && !error && appointments.length === 0 && (
          <EmptyState icon="bi-calendar2-x" title="Ainda não há partidas por aqui" description="Crie um agendamento ou volte em breve para encontrar novos jogos." />
        )}
        {!loading && appointments.length > 0 && (
          <div className="row g-3">
            {appointments.slice(0, 3).map((appointment) => (
              <div className="col-md-6 col-xl-4" key={appointment.id}>
                <AppointmentCard appointment={appointment} />
              </div>
            ))}
          </div>
        )}
      </section>
      <BookingModal show={showBooking} onHide={() => setShowBooking(false)} onCreated={() => void loadDashboard()} />
    </>
  );
}
