import styles from './ArenaMap.module.scss';
import { useEffect, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import type { Arena } from '../../../shared/types';
import type { LocationPoint } from '../types/location';
import { loadGoogleMaps } from '../api/load-google-maps';
import { retainArenaMap } from '../map/retained-arena-map';
import { createArenaMarker } from '../map/create-arena-marker';

export function ArenaMap({
  arenas,
  point,
  radiusKm,
  selectedId,
  onSelect,
  onSearchRegion,
}: {
  arenas: Arena[];
  point: LocationPoint | null;
  radiusKm: number;
  selectedId?: string;
  onSelect: (arena: Arena) => void;
  onSearchRegion: (point: LocationPoint) => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  const runtime = useRef<ReturnType<typeof retainArenaMap> | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const authFailure = () =>
      setError(
        'O Google Maps não autorizou o mapa. Use a lista de arenas enquanto a configuração é revisada.',
      );
    window.addEventListener('techarena:maps-auth-error', authFailure);
    void loadGoogleMaps()
      .then(() => {
        if (!active || !element.current) return;
        runtime.current = retainArenaMap(element.current);
        setReady(true);
      })
      .catch((cause: Error) => {
        if (active) setError(cause.message);
      });
    return () => {
      active = false;
      window.removeEventListener('techarena:maps-auth-error', authFailure);
      runtime.current?.element.remove();
      runtime.current = null;
    };
  }, []);
  useEffect(() => {
    if (!ready || !runtime.current || !point) return;
    const { map } = runtime.current;
    const circle = new google.maps.Circle({
      map,
      center: { lat: point.lat, lng: point.longitude },
      radius: radiusKm * 1000,
      fillColor: '#0d6efd',
      fillOpacity: 0.04,
      strokeColor: '#0d6efd',
      strokeOpacity: 0.4,
      strokeWeight: 1,
      clickable: false,
    });
    const key = JSON.stringify([point.lat, point.longitude, radiusKm]);
    if (runtime.current.viewportKey !== key) {
      const bounds = circle.getBounds();
      if (bounds) map.fitBounds(bounds);
      runtime.current.viewportKey = key;
    }
    return () => circle.setMap(null);
  }, [ready, point, radiusKm]);
  useEffect(() => {
    if (!ready || !runtime.current || point || !arenas.length) return;
    const key = arenas
      .map((arena) => `${arena.id}:${arena.lat}:${arena.longitude}`)
      .join('|');
    if (runtime.current.viewportKey === key) return;
    const bounds = new google.maps.LatLngBounds();
    arenas.forEach((arena) =>
      bounds.extend({ lat: Number(arena.lat), lng: Number(arena.longitude) }),
    );
    runtime.current.map.fitBounds(bounds, 48);
    if (arenas.length === 1) runtime.current.map.setZoom(15);
    runtime.current.viewportKey = key;
  }, [ready, point, arenas]);
  useEffect(() => {
    const selected = arenas.find((arena) => arena.id === selectedId);
    if (ready && selected)
      runtime.current?.map.panTo({
        lat: Number(selected.lat),
        lng: Number(selected.longitude),
      });
  }, [ready, selectedId, arenas]);
  useEffect(() => {
    if (!ready || !runtime.current) return;
    const markers = arenas.map((arena) =>
      createArenaMarker(
        runtime.current!.map,
        arena,
        arena.id === selectedId,
        onSelect,
      ),
    );
    return () => markers.forEach((marker) => marker.setMap(null));
  }, [ready, arenas, selectedId, onSelect]);
  return (
    <section
      aria-label="Mapa de arenas"
      className="position-relative overflow-hidden rounded-4 bg-body-tertiary"
    >
      {error && (
        <div
          className="alert alert-warning m-3"
          role="alert"
        >
          {error}
        </div>
      )}
      {!error && (
        <>
          <div
            ref={element}
            className={`${styles.canvas} w-100`}
          />
          {!ready && (
            <p
              role="status"
              className="p-3"
            >
              Carregando mapa...
            </p>
          )}
          <Button
            className="position-absolute top-0 start-50 translate-middle-x mt-3 shadow rounded-pill text-nowrap touch-target"
            variant="light"
            disabled={!ready}
            onClick={() => {
              const center = runtime.current?.map.getCenter();
              if (center)
                onSearchRegion({ lat: center.lat(), longitude: center.lng() });
            }}
          >
            <i
              className="bi bi-search me-2"
              aria-hidden="true"
            />
            Buscar nesta região
          </Button>
        </>
      )}
    </section>
  );
}
