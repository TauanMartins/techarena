import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../test/test-utils';
import { loadGoogleMaps } from '../api/load-google-maps';
import { ArenaMap } from './ArenaMap';
import type { Arena } from '../../../shared/types';
vi.mock('../api/load-google-maps', () => ({ loadGoogleMaps: vi.fn() }));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const arena: Arena = {
  id: '1',
  address: 'Quadra',
  lat: -23,
  longitude: -46,
  image: null,
  sportIds: ['1'],
  distanceKm: null,
  isLeagueOnly: false,
};
it('uses court-only styling and reuses the same billable map across route remounts', async () => {
  const user = userEvent.setup();
  vi.mocked(loadGoogleMaps).mockResolvedValue();
  const circleRemove = vi.fn();
  let mapElement: HTMLElement;
  const map = {
    fitBounds: vi.fn(),
    setZoom: vi.fn(),
    panTo: vi.fn(),
    getCenter: () => ({ lat: () => -22, lng: () => -45 }),
  };
  const constructor = vi.fn(function (element: HTMLElement) {
    mapElement = element;
    return map;
  });
  class OverlayView {
    static preventMapHitsAndGesturesFrom = vi.fn();
    setMap(map: unknown) {
      if (map) {
        this.onAdd();
        this.draw();
      } else this.onRemove();
    }
    onAdd() {}
    onRemove() {}
    draw() {}
    getPanes() {
      return { overlayMouseTarget: mapElement };
    }
    getProjection() {
      return { fromLatLngToDivPixel: () => ({ x: 100, y: 100 }) };
    }
  }
  vi.stubGlobal('google', {
    maps: {
      Map: constructor,
      RenderingType: { RASTER: 'RASTER' },
      OverlayView,
      LatLng: vi.fn(function () {}),
      Circle: vi.fn(function () {
        return { getBounds: () => 'circle-bounds', setMap: circleRemove };
      }),
      LatLngBounds: vi.fn(function () {
        return { extend: vi.fn() };
      }),
    },
  });
  const onSelect = vi.fn();
  const onSearchRegion = vi.fn();
  const { rerender, unmount } = renderWithProviders(
    <ArenaMap
      arenas={[arena]}
      point={null}
      radiusKm={5}
      onSelect={onSelect}
      onSearchRegion={onSearchRegion}
    />,
  );
  await user.click(
    await screen.findByRole('button', { name: 'Ver quadra: Quadra' }),
  );
  expect(onSelect).toHaveBeenCalledWith(arena);
  expect(constructor).toHaveBeenCalledWith(
    expect.any(HTMLElement),
    expect.objectContaining({
      clickableIcons: false,
      styles: expect.arrayContaining([
        expect.objectContaining({
          featureType: 'poi',
          stylers: [{ visibility: 'off' }],
        }),
      ]),
    }),
  );
  expect(map.setZoom).toHaveBeenCalledWith(15);
  await user.click(screen.getByRole('button', { name: 'Buscar nesta região' }));
  expect(onSearchRegion).toHaveBeenCalledWith({ lat: -22, longitude: -45 });
  rerender(
    <ArenaMap
      arenas={[arena]}
      selectedId="1"
      point={{ lat: -23, longitude: -46 }}
      radiusKm={10}
      onSelect={onSelect}
      onSearchRegion={onSearchRegion}
    />,
  );
  expect(map.fitBounds).toHaveBeenCalledWith('circle-bounds');
  expect(map.panTo).toHaveBeenCalledWith({ lat: -23, lng: -46 });
  expect(
    screen.getByRole('button', { name: 'Ver quadra: Quadra' }),
  ).toHaveAttribute('aria-pressed', 'true');
  unmount();
  expect(circleRemove).toHaveBeenCalledWith(null);
  expect(mapElement!.querySelectorAll('button')).toHaveLength(0);
  map.fitBounds.mockClear();
  renderWithProviders(
    <ArenaMap
      arenas={[arena]}
      point={{ lat: -23, longitude: -46 }}
      radiusKm={10}
      onSelect={onSelect}
      onSearchRegion={onSearchRegion}
    />,
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Buscar nesta região' }),
    ).toBeEnabled(),
  );
  expect(constructor).toHaveBeenCalledTimes(1);
  expect(map.fitBounds).not.toHaveBeenCalled();
  act(() => window.dispatchEvent(new Event('techarena:maps-auth-error')));
  expect(screen.getByRole('alert')).toHaveTextContent('não autorizou');
});
it('shows a usable fallback when the map cannot load', async () => {
  vi.mocked(loadGoogleMaps).mockRejectedValue(
    new Error('Mapa indisponível. Use a lista.'),
  );
  renderWithProviders(
    <ArenaMap
      arenas={[]}
      point={null}
      radiusKm={5}
      onSelect={vi.fn()}
      onSearchRegion={vi.fn()}
    />,
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Mapa indisponível',
  );
});
