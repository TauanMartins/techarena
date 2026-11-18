import { ArenaDiscovery } from '../features/arenas/components/ArenaDiscovery';
import { SectionHeading } from '../components/ui/SectionHeading';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import { useAuthenticatedSession } from '../auth/useAuthenticatedSession';
import { AppointmentCard } from '../features/appointments/components/AppointmentCard';
import { BookingModal } from '../features/appointments/components/BookingModal';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/ui/Feedback';
import { useHomeDashboard } from '../features/appointments/api/appointments.api';
import { SportIcon } from '../components/ui/SportIcon';

export function HomePage() {
  const { profile, token, userId } = useAuthenticatedSession();
  const [showBooking, setShowBooking] = useState(false);
  const dashboardQuery = useHomeDashboard(token, userId);
  const appointments = dashboardQuery.data?.appointments ?? [];
  const favorites = dashboardQuery.data?.favorites;

  return (
    <>
      <header className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <h1 className="h4 mb-1">{`Olá, ${profile?.name?.split(' ')[0] ?? 'atleta'}!`}</h1>
          <p className="text-body-secondary mb-0 small">
            Encontre sua próxima quadra e combine um jogo.
          </p>
        </div>
        <Button onClick={() => setShowBooking(true)}>
          <i
            className="bi bi-plus-lg me-2"
            aria-hidden="true"
          />
          Criar agendamento
        </Button>
      </header>
      <ArenaDiscovery suspended={showBooking} />

      <section className="my-4">
        <SectionHeading
          eyebrow="SELEÇÃO PERSONALIZADA"
          title="Seus esportes favoritos"
          action={
            <Link
              to="/configuracoes"
              className="link-primary fw-semibold small text-decoration-none"
            >
              Editar favoritos <i className="bi bi-arrow-right" />
            </Link>
          }
        />
        {favorites &&
          (favorites.items.length ? (
            <div className="d-flex flex-wrap gap-3">
              {favorites.items.map((sport) => (
                <Card
                  className="border rounded-4"
                  key={sport.id}
                >
                  <Card.Body className="d-flex align-items-center gap-2">
                    <SportIcon name={sport.name} />
                    <Link
                      to={`/agendamentos?sportId=${encodeURIComponent(sport.id)}`}
                      className="stretched-link text-decoration-none"
                    >
                      <strong>{sport.name}</strong>
                    </Link>
                  </Card.Body>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border rounded-4 shadow-sm bg-body">
              <Card.Body className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                <span>
                  Escolha até {favorites.maxFavorites} esportes para
                  personalizar suas recomendações.
                </span>
                <Link
                  to="/configuracoes"
                  className="btn btn-outline-primary"
                >
                  Escolher modalidades
                </Link>
              </Card.Body>
            </Card>
          ))}
      </section>

      <section className="my-4">
        <SectionHeading
          eyebrow="VAMOS JOGAR?"
          title="Próximos agendamentos"
          action={
            <Link
              to="/agendamentos"
              className="link-primary fw-semibold small text-decoration-none"
            >
              Ver todos <i className="bi bi-arrow-right" />
            </Link>
          }
        />
        {dashboardQuery.isPending && (
          <LoadingState label="Buscando partidas..." />
        )}
        {dashboardQuery.error && (
          <ErrorState
            message={
              dashboardQuery.error instanceof Error
                ? dashboardQuery.error.message
                : 'Não foi possível carregar sua página inicial.'
            }
          />
        )}
        {!dashboardQuery.isPending &&
          !dashboardQuery.error &&
          appointments.length === 0 && (
            <EmptyState
              icon="bi-calendar2-x"
              title="Ainda não há partidas por aqui"
              description="Crie um agendamento ou volte em breve para encontrar novos jogos."
            />
          )}
        {!dashboardQuery.isPending && appointments.length > 0 && (
          <div className="row g-3">
            {appointments.slice(0, 3).map((appointment) => (
              <div
                className="col-md-6 col-xl-4"
                key={appointment.id}
              >
                <AppointmentCard
                  appointment={appointment}
                  token={token}
                />
              </div>
            ))}
          </div>
        )}
      </section>
      <BookingModal
        show={showBooking}
        onHide={() => setShowBooking(false)}
        onCreated={() => void dashboardQuery.refetch()}
      />
    </>
  );
}
