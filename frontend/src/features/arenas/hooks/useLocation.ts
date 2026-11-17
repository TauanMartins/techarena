import { useRef, useState, useEffect } from 'react';
import type { LocationPoint } from '../types/location';

export function useLocation(initialPoint: LocationPoint | null = null) {
  const [point, setPoint] = useState<LocationPoint | null>(initialPoint);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  useEffect(
    () => () => {
      requestId.current++;
    },
    [],
  );
  function selectPoint(value: LocationPoint) {
    requestId.current++;
    setPending(false);
    setError(null);
    setPoint(value);
  }
  function locate() {
    if (!navigator.geolocation) {
      setError('Localização indisponível. Escolha uma região no mapa.');
      return;
    }
    const id = ++requestId.current;
    setPending(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (id !== requestId.current) return;
        setPoint({ lat: coords.latitude, longitude: coords.longitude });
        setPending(false);
      },
      (cause) => {
        if (id !== requestId.current) return;
        setPending(false);
        setError(
          cause.code === 1
            ? 'Permissão de localização negada. Você pode escolher uma região no mapa.'
            : 'Não foi possível localizar você. Tente novamente ou escolha uma região no mapa.',
        );
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  }
  return { point, pending, error, locate, selectPoint };
}
