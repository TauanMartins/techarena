import { DomainError } from './domain-error.js';
export interface GeoFilter {
  lat?: number;
  longitude?: number;
  radiusKm?: number;
}
export function assertGeo(query: GeoFilter): void {
  if (
    (query.lat === undefined) !== (query.longitude === undefined) ||
    (query.lat !== undefined &&
      (!Number.isFinite(query.lat) || query.lat < -90 || query.lat > 90)) ||
    (query.longitude !== undefined &&
      (!Number.isFinite(query.longitude) ||
        query.longitude < -180 ||
        query.longitude > 180)) ||
    (query.radiusKm !== undefined &&
      (query.lat === undefined ||
        !Number.isFinite(query.radiusKm) ||
        query.radiusKm <= 0 ||
        query.radiusKm > 1000))
  ) {
    throw new DomainError(
      'invalid',
      'INVALID_LOCATION',
      'Supply valid latitude and longitude together; radius requires a location',
    );
  }
}
