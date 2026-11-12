import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import { useAuth } from '../auth/useAuth';
import { AppointmentCard } from '../features/appointments/components/AppointmentCard';
import { BookingModal } from '../features/appointments/components/BookingForm';
import { EmptyState, ErrorState, LoadingState, PageHeading } from '../components/ui/Feedback';
import { useHomeDashboard } from '../features/appointments/api/appointments.api';
import { SportIcon } from '../components/ui/SportIcon';

export function HomePage() {
  const { session, profile } = useAuth();
  const token = session!.access_token;
  const userId = session!.user.id;
  const [showBooking, setShowBooking] = useState(false);
  const dashboardQuery = useHomeDashboard(token, userId);
  const appointments = dashboardQuery.data?.appointments ?? [];
  const favorites = dashboardQuery.data?.favorites;

  return (
    <>
      <PageHeading
        eyebrow="SEU ESPORTE, SUA COMUNIDADE"
        title={`Olá, ${profile?.name?.split(' ')[0] ?? 'atleta'}!`}
        description="Descubra uma partida, encontre seu time e coloque o jogo na agenda."
        action={<Button onClick={() => setShowBooking(true)}><i className="bi bi-plus-lg me-2" />Criar agendamento</Button>}
      />
      <section className="d-flex align-items-center justify-content-between gap-4 p-4 p-md-5 rounded-4 bg-primary-subtle text-primary-emphasis">
        <div>
          <span className="small fw-semibold">HORA DE ENTRAR EM CAMPO</span>
          <h2 className="h5 fw-bold mb-0">O próximo jogo pode começar com você.</h2>
          <p>Encontre atletas perto de você e transforme qualquer dia em dia de jogo.</p>
          <Link to="/agendamentos" className="btn btn-light">Explorar agendamentos <i className="bi bi-arrow-up-right ms-2" /></Link>
        </div>
        <div className="d-none d-lg-block display-1" aria-hidden="true"><i className="bi bi-trophy-fill" /></div>
      </section>

      <section className="my-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
          <div><span className="d-block small fw-semibold text-body-secondary mb-1">SELEÇÃO PERSONALIZADA</span><h2 className="h5 fw-bold mb-0">Seus esportes favoritos</h2></div>
          <Link to="/configuracoes" className="link-primary fw-semibold small text-decoration-none">Editar favoritos <i className="bi bi-arrow-right" /></Link>
        </div>
        {favorites && (
          favorites.items.length ? (
            <div className="d-flex flex-wrap gap-3">
              {favorites.items.map((sport) => (
                <Card className="border rounded-4" key={sport.id}>
                  <Card.Body className="d-flex align-items-center gap-2">
                    <SportIcon name={sport.name} />
                    <strong>{sport.name}</strong>
                  </Card.Body>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border rounded-4 shadow-sm bg-body">
              <Card.Body className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                <span>Escolha até {favorites.maxFavorites} esportes para personalizar suas recomendações.</span>
                <Link to="/configuracoes" className="btn btn-outline-primary">Escolher modalidades</Link>
              </Card.Body>
            </Card>
          )
        )}
      </section>

      <section className="my-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
          <div><span className="d-block small fw-semibold text-body-secondary mb-1">VAMOS JOGAR?</span><h2 className="h5 fw-bold mb-0">Próximos agendamentos</h2></div>
          <Link to="/agendamentos" className="link-primary fw-semibold small text-decoration-none">Ver todos <i className="bi bi-arrow-right" /></Link>
        </div>
        {dashboardQuery.isPending && <LoadingState label="Buscando partidas..." />}
        {dashboardQuery.error && (
          <ErrorState
            message={
              dashboardQuery.error instanceof Error
                ? dashboardQuery.error.message
                : 'Não foi possível carregar sua página inicial.'
            }
          />
        )}
        {!dashboardQuery.isPending && !dashboardQuery.error && appointments.length === 0 && (
          <EmptyState icon="bi-calendar2-x" title="Ainda não há partidas por aqui" description="Crie um agendamento ou volte em breve para encontrar novos jogos." />
        )}
        {!dashboardQuery.isPending && appointments.length > 0 && (
          <div className="row g-3">
            {appointments.slice(0, 3).map((appointment) => (
              <div className="col-md-6 col-xl-4" key={appointment.id}>
                <AppointmentCard appointment={appointment} />
              </div>
            ))}
          </div>
        )}
      </section>
      <BookingModal show={showBooking} onHide={() => setShowBooking(false)} onCreated={() => void dashboardQuery.refetch()} />
    </>
  );
}
