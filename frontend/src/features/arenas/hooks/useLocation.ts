import { deviceLocation } from './device-location';
import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useSyncExternalStore,
} from 'react';
import type { LocationPoint } from '../types/location';

export function useLocation(initialPoint: LocationPoint | null = null) {
  const cached = useSyncExternalStore(
    deviceLocation.subscribe,
    deviceLocation.get,
    deviceLocation.get,
  );
  const [manualPoint, setPoint] = useState<LocationPoint | null>(initialPoint);
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
  const locate = useCallback(() => {
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
        deviceLocation.set({
          lat: coords.latitude,
          longitude: coords.longitude,
        });
        setPoint(null);
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
  }, []);
  useEffect(() => {
    if (cached || manualPoint || !navigator.permissions) return;
    let active = true;
    void navigator.permissions
      .query({ name: 'geolocation' })
      .then((permission) => {
        if (active && permission.state === 'granted') locate();
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [cached, manualPoint, locate]);
  return { point: manualPoint ?? cached, pending, error, locate, selectPoint };
}
