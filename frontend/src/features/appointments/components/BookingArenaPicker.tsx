import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import type { Arena } from '../../../shared/types';
import { useAuthenticatedSession } from '../../../auth/useAuthenticatedSession';
import { ArenaMap } from '../../arenas/components/ArenaMap';
import { listRegionArenas } from '../../arenas/api/list-region-arenas';
import { useLocation } from '../../arenas/hooks/useLocation';
import { ErrorState } from '../../../components/ui/Feedback';

export function BookingArenaPicker({
  arenas,
  selected,
  locked,
  loading,
  location,
  onSelect,
  error,
}: {
  arenas: Arena[];
  selected?: Arena;
  locked: boolean;
  loading: boolean;
  location: ReturnType<typeof useLocation>;
  onSelect: (arena: Arena) => void;
  error?: string;
}) {
  const { token, userId } = useAuthenticatedSession();
  const [showMap, setShowMap] = useState(false);
  const filters = location.point ? { ...location.point, radiusKm: 100 } : {};
  const map = useQuery({
    queryKey: ['bookingArenaMap', userId, filters],
    queryFn: ({ signal }) => listRegionArenas(token, filters, signal),
    enabled: showMap && !locked,
    staleTime: 5 * 60_000,
  });
  return (
    <section
      aria-label="Escolher quadra"
      className="border rounded-3 p-3 mb-2"
    >
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
        <h3 className="h6 mb-0">Local</h3>
        <Button
          size="sm"
          variant="outline-primary"
          onClick={() => setShowMap(!showMap)}
        >
          <i
            className={`bi ${showMap ? 'bi-list-ul' : 'bi-map'} me-2`}
            aria-hidden="true"
          />
          {showMap ? 'Voltar à lista' : 'Ver quadras no mapa'}
        </Button>
      </div>
      {!locked && (
        <Button
          size="sm"
          variant="link"
          className="px-0 mb-2"
          disabled={location.pending}
          onClick={location.locate}
        >
          <i
            className="bi bi-crosshair me-2"
            aria-hidden="true"
          />
          {location.pending ? 'Localizando...' : 'Usar minha localização'}
        </Button>
      )}
      {location.error && (
        <p className="small text-body-secondary">{location.error}</p>
      )}
      {showMap && (
        <>
          <ArenaMap
            arenas={locked && selected ? [selected] : (map.data?.items ?? [])}
            point={location.point}
            radiusKm={100}
            selectedId={selected?.id}
            onSelect={(arena) => {
              if (!locked) onSelect(arena);
              setShowMap(false);
            }}
            onSearchRegion={location.selectPoint}
          />
          {map.isFetching && (
            <p
              role="status"
              className="small"
            >
              Carregando quadras...
            </p>
          )}
          {map.error && <ErrorState message={map.error.message} />}
        </>
      )}
      <Form.Group
        controlId="booking-arena"
        className={showMap ? 'visually-hidden' : ''}
      >
        <Form.Label className="small">Arena</Form.Label>
        <Form.Select
          value={selected?.id ?? ''}
          disabled={locked || loading}
          isInvalid={Boolean(error)}
          onChange={(event) => {
            const arena = arenas.find((item) => item.id === event.target.value);
            if (arena) onSelect(arena);
          }}
        >
          <option
            value=""
            disabled
          >
            {loading ? 'Carregando quadras...' : 'Selecione uma quadra'}
          </option>
          {arenas.map((arena) => (
            <option
              key={arena.id}
              value={arena.id}
            >
              {arena.address}
              {arena.distanceKm != null
                ? ` · ${arena.distanceKm.toFixed(1)} km`
                : ''}
            </option>
          ))}
        </Form.Select>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
        {!locked && (
          <Form.Text>
            {location.point
              ? 'As 10 quadras mais próximas em até 100 km. '
              : 'Uma seleção de até 10 quadras. Ative a localização para ordenar por proximidade. '}
            Use o mapa para explorar as demais.
          </Form.Text>
        )}
      </Form.Group>
    </section>
  );
}
