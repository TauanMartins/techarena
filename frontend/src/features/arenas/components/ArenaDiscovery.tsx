import { listRegionArenas } from '../api/list-region-arenas';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useAuthenticatedSession } from '../../../auth/useAuthenticatedSession';
import { api } from '../../../lib/api-client';
import type { LocationPoint } from '../types/location';
import type { Arena } from '../../../shared/types';
import { useLocation } from '../hooks/useLocation';
import { ArenaMap } from './ArenaMap';
import { ArenaDetails } from './ArenaDetails';
import { BookingModal } from '../../appointments/components/BookingModal';
import { PageControls } from '../../../components/ui/PageControls';
import { ErrorState, LoadingState } from '../../../components/ui/Feedback';

interface DiscoveryState {
  point: LocationPoint | null;
  sportId: string;
  radiusKm: number;
  search: string;
  page: number;
  view: 'map' | 'list';
  savedAt: number;
}
export function ArenaDiscovery() {
  const { token, userId } = useAuthenticatedSession();
  const client = useQueryClient();
  const [saved] = useState(() => {
    const state = client.getQueryData<DiscoveryState>([
      'arenaDiscoveryState',
      userId,
    ]);
    return state && Date.now() - state.savedAt < 30 * 60_000
      ? state
      : undefined;
  });
  const location = useLocation(saved?.point);
  const [view, setView] = useState<'map' | 'list'>(saved?.view ?? 'map');
  const [mapActivated, setMapActivated] = useState(view === 'map');
  const [sportId, setSportId] = useState(saved?.sportId ?? '');
  const [radiusKm, setRadius] = useState(saved?.radiusKm ?? 5);
  const [search, setSearch] = useState(saved?.search ?? '');
  const [submittedSearch, setSubmittedSearch] = useState(saved?.search ?? '');
  const [page, setPage] = useState(saved?.page ?? 1);
  const [selected, setSelected] = useState<Arena | null>(null);
  const [booking, setBooking] = useState<Arena | null>(null);
  const [routeParams, setRouteParams] = useSearchParams();
  const arenaId = routeParams.get('arenaId') || undefined;
  useEffect(() => {
    client.setQueryData<DiscoveryState>(['arenaDiscoveryState', userId], {
      point: location.point,
      sportId,
      radiusKm,
      search: submittedSearch,
      page,
      view,
      savedAt: Date.now(),
    });
  }, [
    client,
    userId,
    location.point,
    sportId,
    radiusKm,
    submittedSearch,
    page,
    view,
  ]);
  const filters = {
    arenaId,
    page,
    limit: 20,
    sportId: sportId || undefined,
    search: submittedSearch || undefined,
    ...(location.point ? { ...location.point, radiusKm } : {}),
  };
  const regionMap = view === 'map' && Boolean(location.point) && !arenaId;
  const arenasQuery = useQuery({
    enabled: !regionMap,
    queryKey: ['arenas', userId, filters],
    queryFn: () => api.listArenas(token, filters),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
  const { page: _page, ...regionFilters } = filters;
  const mapQuery = useQuery({
    queryKey: ['arenaMapResults', userId, regionFilters],
    enabled: regionMap,
    queryFn: ({ signal }) => listRegionArenas(token, regionFilters, signal),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
  const results = regionMap ? mapQuery : arenasQuery;
  const sportsQuery = useQuery({
    queryKey: ['sports', userId],
    queryFn: () => api.getSports(token),
    staleTime: 60 * 60_000,
    gcTime: 60 * 60_000,
  });
  const arenas = results.data?.items ?? [];
  const activeArena = selected ?? (arenaId ? arenas[0] : null);
  const sports = sportsQuery.data?.items ?? [];
  function reset() {
    setPage(1);
    setSelected(null);
    if (arenaId)
      setRouteParams((current) => {
        const next = new URLSearchParams(current);
        next.delete('arenaId');
        return next;
      });
  }
  return (
    <section
      className="mb-4"
      aria-label="Descobrir arenas"
    >
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
        <h2 className="h4 mb-0">Onde vamos jogar?</h2>
        <div
          className="btn-group"
          role="group"
          aria-label="Visualização das quadras"
        >
          <Button
            variant={view === 'map' ? 'primary' : 'outline-primary'}
            aria-pressed={view === 'map'}
            onClick={() => {
              setView('map');
              setMapActivated(true);
            }}
          >
            <i
              className="bi bi-map me-2"
              aria-hidden="true"
            />
            Mapa
          </Button>
          <Button
            variant={view === 'list' ? 'primary' : 'outline-primary'}
            aria-pressed={view === 'list'}
            onClick={() => setView('list')}
          >
            <i
              className="bi bi-list-ul me-2"
              aria-hidden="true"
            />
            Lista
          </Button>
        </div>
      </div>
      <p className="small text-body-secondary mb-2">
        Selecione uma quadra para ver modalidades, agendamentos e rotas.
      </p>
      {arenaId && (
        <Button
          className="mb-3"
          variant="outline-secondary"
          onClick={reset}
        >
          Explorar outras arenas
        </Button>
      )}
      <Form
        className="row g-2 mb-3"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmittedSearch(search.trim());
          reset();
        }}
      >
        <Form.Group
          className="col-sm-5"
          controlId="arena-search"
        >
          <Form.Label>Endereço da arena</Form.Label>
          <Form.Control
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rua, bairro ou cidade"
          />
        </Form.Group>
        <Form.Group
          className="col-sm-4"
          controlId="arena-sport"
        >
          <Form.Label>Modalidade</Form.Label>
          <Form.Select
            value={sportId}
            onChange={(event) => {
              setSportId(event.target.value);
              reset();
            }}
          >
            <option value="">Todas as modalidades</option>
            {sports.map((sport) => (
              <option
                key={sport.id}
                value={sport.id}
              >
                {sport.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <div className="col-sm-3 d-flex align-items-end">
          <Button type="submit">Buscar arenas</Button>
        </div>
      </Form>
      <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
        <Button
          variant="outline-primary"
          disabled={location.pending}
          onClick={() => {
            reset();
            location.locate();
          }}
        >
          <i
            className="bi bi-crosshair me-2"
            aria-hidden="true"
          />
          {location.pending ? 'Localizando...' : 'Usar minha localização'}
        </Button>
        <Button
          variant="outline-secondary"
          disabled={results.isFetching}
          onClick={() => void results.refetch()}
          aria-label="Atualizar quadras"
        >
          <i
            className="bi bi-arrow-clockwise"
            aria-hidden="true"
          />
        </Button>
        {location.point && (
          <Form.Group
            controlId="arena-radius"
            className="d-flex align-items-center gap-2"
          >
            <Form.Label className="mb-0">Raio</Form.Label>
            <Form.Select
              value={radiusKm}
              onChange={(event) => {
                setRadius(Number(event.target.value));
                reset();
              }}
            >
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
      </div>
      {location.error && (
        <p
          role="alert"
          className="text-body-secondary"
        >
          {location.error}
        </p>
      )}
      <div hidden={view !== 'map'}>
        {mapActivated && (
          <ArenaMap
            arenas={arenas}
            point={location.point}
            radiusKm={radiusKm}
            selectedId={activeArena?.id}
            onSelect={setSelected}
            onSearchRegion={(point) => {
              reset();
              location.selectPoint(point);
            }}
          />
        )}
      </div>
      {activeArena && (
        <ArenaDetails
          arena={activeArena}
          sports={sports}
          onClose={() => {
            setSelected(null);
            if (arenaId) setRouteParams({});
          }}
          onBook={(arena) => {
            setBooking(arena);
            setSelected(null);
            if (arenaId) setRouteParams({});
          }}
        />
      )}
      {sportsQuery.error && <ErrorState message={sportsQuery.error.message} />}
      {results.error && <ErrorState message={results.error.message} />}
      {results.isPending && <LoadingState label="Buscando arenas..." />}
      {results.data && (
        <>
          <p
            role="status"
            className="small text-body-secondary mt-3 mb-2"
          >
            {results.data.total} arenas encontradas
            {location.point ? ` em até ${radiusKm} km` : ''}. Resultados desta
            página na lista.{' '}
            {regionMap && mapQuery.data
              ? `${mapQuery.data.items.length} quadras exibidas no mapa.`
              : ''}
          </p>
          {!arenas.length && (
            <div className="alert alert-info">
              Nenhuma arena encontrada. Tente outra modalidade, endereço ou
              região.
              {location.point && radiusKm < 100 && (
                <Button
                  className="ms-2"
                  variant="outline-primary"
                  onClick={() => {
                    setRadius(
                      [2, 5, 10, 25, 50, 100].find(
                        (value) => value > radiusKm,
                      )!,
                    );
                    reset();
                  }}
                >
                  Ampliar raio
                </Button>
              )}
            </div>
          )}
          <div className={`list-group ${view !== 'list' ? 'd-none' : ''}`}>
            {arenas.map((arena) => (
              <button
                key={arena.id}
                type="button"
                className={`list-group-item list-group-item-action text-start ${selected?.id === arena.id ? 'active' : ''}`}
                onClick={() => setSelected(arena)}
              >
                <strong>{arena.address}</strong>
                {arena.distanceKm != null && (
                  <span className="ms-2">{arena.distanceKm.toFixed(1)} km</span>
                )}
              </button>
            ))}
          </div>
          {view === 'list' && (
            <PageControls
              page={page}
              hasNext={results.data.hasNextPage}
              busy={results.isFetching}
              onChange={(value) => {
                setPage(value);
                setSelected(null);
              }}
              label="Páginas de arenas"
            />
          )}
        </>
      )}
      {booking && (
        <BookingModal
          show
          onHide={() => setBooking(null)}
          onCreated={() => setBooking(null)}
          initialArena={booking}
          initialSportId={sportId || undefined}
        />
      )}
    </section>
  );
}
