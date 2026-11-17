import type { Arena } from '../../../shared/types';
export function ArenaDirections({
  arena,
}: {
  arena: Pick<Arena, 'lat' | 'longitude'>;
}) {
  const destination = `${arena.lat},${arena.longitude}`;
  const googleUrl = `https://www.google.com/maps/dir/?${new URLSearchParams({ api: '1', destination })}`;
  const wazeUrl = `https://waze.com/ul?${new URLSearchParams({ ll: destination, navigate: 'yes', utm_source: 'techarena' })}`;
  return (
    <div
      className="d-flex flex-wrap gap-2"
      aria-label="Como chegar"
    >
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-outline-secondary"
      >
        <i
          className="bi bi-sign-turn-right me-2"
          aria-hidden="true"
        />
        Google Maps
      </a>
      <a
        href={wazeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-outline-secondary"
      >
        Abrir no Waze{' '}
        <i
          className="bi bi-box-arrow-up-right ms-2"
          aria-hidden="true"
        />
      </a>
    </div>
  );
}
