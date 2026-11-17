import { useQuery } from '@tanstack/react-query';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { appointmentApi } from '../api/appointments.api';
import type { useLocation } from '../../arenas/hooks/useLocation';
export function AppointmentFilters({
  token,
  userId,
  params,
  onChange,
  location,
  mine,
}: {
  token: string;
  userId: string;
  params: URLSearchParams;
  onChange: (name: string, value: string) => void;
  location: ReturnType<typeof useLocation>;
  mine: boolean;
}) {
  const sports = useQuery({
    queryKey: ['sports', userId],
    queryFn: () => appointmentApi.sports(token),
  });
  return (
    <section
      aria-label="Filtros dos agendamentos"
      className="border rounded-4 p-3 mb-3"
    >
      <div className="row g-3">
        <Form.Group
          className="col-md-4"
          controlId="appointment-sport"
        >
          <Form.Label>Modalidade</Form.Label>
          <Form.Select
            value={params.get('sportId') ?? ''}
            onChange={(event) => onChange('sportId', event.target.value)}
          >
            <option value="">Todas as modalidades</option>
            {sports.data?.items.map((sport) => (
              <option
                key={sport.id}
                value={sport.id}
              >
                {sport.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group
          className="col-md-4"
          controlId="appointment-sort"
        >
          <Form.Label>Ordenar por</Form.Label>
          <Form.Select
            value={params.get('sort') ?? 'soon'}
            onChange={(event) => onChange('sort', event.target.value)}
          >
            <option value="soon">Mais próximos na agenda</option>
            <option value="later">Mais distantes na agenda</option>
            <option
              value="near"
              disabled={!location.point}
            >
              Mais perto
            </option>
            <option
              value="far"
              disabled={!location.point}
            >
              Mais longe
            </option>
          </Form.Select>
        </Form.Group>
        {mine && (
          <Form.Group
            className="col-md-4"
            controlId="appointment-period"
          >
            <Form.Label>Período</Form.Label>
            <Form.Select
              value={params.get('period') ?? 'upcoming'}
              onChange={(event) => onChange('period', event.target.value)}
            >
              <option value="upcoming">Próximos</option>
              <option value="past">Anteriores</option>
              <option value="all">Todos</option>
            </Form.Select>
          </Form.Group>
        )}
      </div>
      <details
        className="mt-3"
        open={
          params.get('favorites') === 'true' ||
          params.has('radius') ||
          undefined
        }
      >
        <summary className="text-primary fw-semibold">
          Mais filtros e proximidade
        </summary>
        <div className="d-flex flex-wrap align-items-center gap-3 mt-3">
          <Form.Check
            id="appointment-favorites"
            label="Priorizar meus esportes favoritos"
            checked={params.get('favorites') === 'true'}
            onChange={(event) =>
              onChange('favorites', String(event.target.checked))
            }
          />
          <Button
            variant="outline-primary"
            disabled={location.pending}
            onClick={location.locate}
          >
            {location.pending
              ? 'Localizando...'
              : 'Usar localização para proximidade'}
          </Button>
          {location.point && (
            <Form.Group
              controlId="appointment-radius"
              className="d-flex align-items-center gap-2"
            >
              <Form.Label className="mb-0">Raio</Form.Label>
              <Form.Select
                value={params.get('radius') ?? ''}
                onChange={(event) => onChange('radius', event.target.value)}
              >
                <option value="">Sem limite</option>
                {[2, 5, 10, 25, 50, 100].map((radius) => (
                  <option
                    key={radius}
                    value={radius}
                  >
                    {radius} km
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}
          {params.has('arenaId') && (
            <Button
              variant="outline-secondary"
              onClick={() => onChange('arenaId', '')}
            >
              Remover filtro de arena
            </Button>
          )}
        </div>
      </details>
      {location.error && (
        <p
          role="alert"
          className="mt-2 mb-0"
        >
          {location.error}
        </p>
      )}
      {sports.error && (
        <p role="alert">
          Não foi possível carregar as modalidades. Tente atualizar a página.
        </p>
      )}
      {location.point && (
        <small className="d-block mt-2 text-body-secondary">
          Distâncias em linha reta. A prioridade de favoritos é aplicada antes
          da ordenação escolhida.
        </small>
      )}
    </section>
  );
}
