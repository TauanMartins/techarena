import { ToastNotice } from '../components/ui/ToastNotice';
import { AppointmentFilters } from '../features/appointments/components/AppointmentFilters';
import { PageControls } from '../components/ui/PageControls';
import { useLocation } from '../features/arenas/hooks/useLocation';
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { AppointmentCard } from '../features/appointments/components/AppointmentCard';
import { BookingModal } from '../features/appointments/components/BookingModal';
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
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const mine = params.get('view') === 'mine';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const sort = params.get('sort') ?? (location.point ? 'near' : 'soon');
  const period = params.get('period') ?? 'upcoming';
  const radius = Number(params.get('radius'));
  const useDistance = sort === 'near' || sort === 'far';
  function changeFilter(name: string, value: string) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(name, value);
      else next.delete(name);
      if (name === 'sort' && value !== 'near' && value !== 'far')
        next.delete('radius');
      if (name === 'radius' && value) next.set('sort', 'near');
      if (name !== 'page') next.delete('page');
      return next;
    });
  }
  const appointmentsQuery = useAppointments(
    token,
    userId,
    {
      page,
      limit: 20,
      sportId: params.get('sportId') || undefined,
      arenaId: params.get('arenaId') || undefined,
      period:
        period === 'upcoming' || period === 'past' || period === 'all'
          ? period
          : undefined,
      orderByTime: sort === 'later' ? 'future' : 'recent',
      preferSports: params.get('favorites') === 'true',
      ...(location.point
        ? {
            ...location.point,
            distance: useDistance ? (sort as 'near' | 'far') : 'none',
            radiusKm: radius > 0 && radius <= 1000 ? radius : undefined,
          }
        : {}),
    },
    mine,
  );
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
          <div className="d-flex flex-wrap gap-2">
            <Link
              to="/"
              className="btn btn-outline-secondary"
            >
              <i
                className="bi bi-map me-2"
                aria-hidden="true"
              />
              Ver quadras
            </Link>
            <Button onClick={() => setShowBooking(true)}>
              <i className="bi bi-plus-lg me-2" />
              Criar agendamento
            </Button>
          </div>
        }
      />
      <div
        className="d-flex flex-wrap gap-2 mb-3"
        role="group"
        aria-label="Visão dos agendamentos"
      >
        <Button
          variant={!mine ? 'primary' : 'outline-primary'}
          aria-pressed={!mine}
          onClick={() => changeFilter('view', '')}
        >
          Explorar partidas
        </Button>
        <Button
          variant={mine ? 'primary' : 'outline-primary'}
          aria-pressed={mine}
          onClick={() => changeFilter('view', 'mine')}
        >
          Meus agendamentos
        </Button>
        <Button
          className="ms-auto"
          aria-label="Atualizar"
          variant="outline-secondary"
          disabled={appointmentsQuery.isFetching}
          onClick={() => void appointmentsQuery.refetch()}
        >
          <i
            className="bi bi-arrow-clockwise"
            aria-hidden="true"
          />
        </Button>
      </div>
      {params.get('arenaId') && (
        <div className="alert alert-primary d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span>Exibindo partidas da quadra selecionada.</span>
          <Link to={`/?arenaId=${encodeURIComponent(params.get('arenaId')!)}`}>
            Voltar à quadra
          </Link>
        </div>
      )}
      <AppointmentFilters
        token={token}
        userId={userId}
        params={params}
        onChange={changeFilter}
        location={location}
        mine={mine}
      />
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        {appointmentsQuery.data && (
          <span className="small text-body-secondary">
            {appointmentsQuery.data.total ?? appointments.length} agendamentos
            encontrados
          </span>
        )}
        {Array.from(params.keys()).some(
          (key) => key !== 'view' && key !== 'page',
        ) && (
          <Button
            size="sm"
            variant="link"
            onClick={() => setParams(mine ? { view: 'mine' } : {})}
          >
            Limpar filtros
          </Button>
        )}
      </div>
      {notice && <ToastNotice message={notice} />}
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
      {appointmentsQuery.data && (
        <PageControls
          page={page}
          hasNext={appointmentsQuery.data.hasNextPage}
          busy={appointmentsQuery.isFetching}
          onChange={(value) => changeFilter('page', String(value))}
        />
      )}
      <BookingModal
        show={showBooking}
        onHide={() => setShowBooking(false)}
        onCreated={() => void appointmentsQuery.refetch()}
      />
    </>
  );
}
