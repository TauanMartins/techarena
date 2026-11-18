import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../test/test-utils';
import { api } from '../../../lib/api-client';
import type { Arena } from '../../../shared/types';
import { ArenaDiscovery } from './ArenaDiscovery';
import { appointmentApi } from '../../appointments/api/appointments.api';
vi.mock('../../../auth/useAuth', () => ({
  useAuth: () => ({
    session: { access_token: 'token', user: { id: 'user-1' } },
  }),
}));
vi.mock('./ArenaMap', () => ({
  ArenaMap: ({
    arenas,
    onSelect,
    onSearchRegion,
  }: {
    arenas: Arena[];
    onSelect: (arena: Arena) => void;
    onSearchRegion: (point: { lat: number; longitude: number }) => void;
  }) => (
    <div>
      <button onClick={() => onSearchRegion({ lat: -23, longitude: -46 })}>
        Buscar nesta região
      </button>
      {arenas.map((arena) => (
        <button
          key={arena.id}
          onClick={() => onSelect(arena)}
        >
          Marcador {arena.address}
        </button>
      ))}
    </div>
  ),
}));
const arena: Arena = {
  id: '1',
  address: 'Quadra Central',
  sportIds: ['1'],
  lat: -23,
  longitude: -46,
  distanceKm: 1.5,
  image: null,
  isLeagueOnly: false,
};
const page = {
  items: [arena],
  page: 1,
  total: 21,
  limit: 20,
  totalPages: 2,
  hasNextPage: true,
  hasPreviousPage: false,
};
beforeEach(() => {
  vi.spyOn(api, 'getSports').mockResolvedValue({
    ...page,
    items: [{ id: '1', name: 'Futebol', defaultPlayers: 10 }],
  });
});
afterEach(() => vi.restoreAllMocks());
it('searches, filters, paginates and discovers nearby arenas without Places API', async () => {
  const user = userEvent.setup();
  const list = vi.spyOn(api, 'listArenas').mockResolvedValue(page);
  renderWithProviders(<ArenaDiscovery />);
  await screen.findByText(
    /21 arenas encontradas\. Resultados paginados apenas na lista/,
  );
  await user.click(screen.getByRole('button', { name: 'Lista' }));
  await user.click(screen.getByRole('button', { name: 'Próxima' }));
  await waitFor(() =>
    expect(list).toHaveBeenCalledWith(
      'token',
      expect.objectContaining({ page: 2 }),
    ),
  );
  await user.type(screen.getByLabelText('Endereço da arena'), 'Centro');
  await user.click(screen.getByRole('button', { name: 'Buscar arenas' }));
  await waitFor(() =>
    expect(list).toHaveBeenCalledWith(
      'token',
      expect.objectContaining({ page: 1, search: 'Centro' }),
    ),
  );
  await user.selectOptions(screen.getByLabelText('Modalidade'), '1');
  await user.click(screen.getByRole('button', { name: 'Mapa' }));
  await user.click(screen.getByRole('button', { name: 'Buscar nesta região' }));
  await waitFor(() =>
    expect(list).toHaveBeenCalledWith(
      'token',
      expect.objectContaining({
        lat: -23,
        longitude: -46,
        radiusKm: 5,
        sportId: '1',
      }),
    ),
  );
  await user.selectOptions(screen.getByLabelText('Raio'), '25');
  await waitFor(() =>
    expect(list).toHaveBeenCalledWith(
      'token',
      expect.objectContaining({ radiusKm: 25 }),
    ),
  );
  await user.click(
    screen.getByRole('button', { name: 'Marcador Quadra Central' }),
  );
  expect(
    screen.getByRole('link', { name: 'Ver agendamentos desta arena' }),
  ).toHaveAttribute('href', '/agendamentos?arenaId=1');
  expect(
    screen.getByText('1.5 km em linha reta da região pesquisada'),
  ).toBeInTheDocument();
});
it('preserves a selected arena outside the booking catalog first page and allows a reserve organizer', async () => {
  const user = userEvent.setup();
  vi.spyOn(api, 'listArenas').mockResolvedValue(page);
  vi.spyOn(appointmentApi, 'arenas').mockResolvedValue({
    ...page,
    items: [],
    hasNextPage: false,
  });
  vi.spyOn(appointmentApi, 'sports').mockResolvedValue({
    ...page,
    items: [{ id: '1', name: 'Futebol', defaultPlayers: 10 }],
  });
  vi.spyOn(appointmentApi, 'availability').mockResolvedValue({
    items: [{ id: '1', horary: '20:00' }],
  });
  const create = vi
    .spyOn(appointmentApi, 'create')
    .mockResolvedValue({ id: '1' } as never);
  renderWithProviders(<ArenaDiscovery />);
  await user.click(
    await screen.findByRole('button', { name: 'Marcador Quadra Central' }),
  );
  await user.click(screen.getByRole('button', { name: 'Agendar aqui' }));
  await screen.findByRole('option', { name: '20:00' });
  expect(screen.getByLabelText('Arena')).toHaveValue('1');
  expect(screen.getByLabelText('Esporte')).toHaveValue('1');
  await user.selectOptions(screen.getByLabelText('Horário disponível'), '1');
  await user.click(
    screen.getByLabelText('Participar como titular (desmarque para reserva)'),
  );
  await user.click(
    screen.getByRole('button', { name: 'Publicar agendamento' }),
  );
  await waitFor(() =>
    expect(create).toHaveBeenCalledWith(
      'token',
      expect.objectContaining({ arenaId: '1', sportId: '1', holder: false }),
    ),
  );
});
it('offers a larger radius on empty results and displays request errors', async () => {
  const user = userEvent.setup();
  const list = vi
    .spyOn(api, 'listArenas')
    .mockResolvedValue({ ...page, items: [], total: 0, hasNextPage: false });
  renderWithProviders(<ArenaDiscovery />);
  await user.click(screen.getByRole('button', { name: 'Buscar nesta região' }));
  await user.click(await screen.findByRole('button', { name: 'Ampliar raio' }));
  await waitFor(() =>
    expect(list).toHaveBeenCalledWith(
      'token',
      expect.objectContaining({ radiusKm: 10 }),
    ),
  );
  list.mockRejectedValue(new Error('Arenas indisponíveis'));
  await user.selectOptions(screen.getByLabelText('Raio'), '50');
  expect(await screen.findByText('Arenas indisponíveis')).toBeInTheDocument();
});

it('opens the arena referenced by an appointment and clears the selection to explore', async () => {
  const user = userEvent.setup();
  const list = vi.spyOn(api, 'listArenas').mockResolvedValue(page);
  renderWithProviders(<ArenaDiscovery />, { initialEntries: ['/?arenaId=1'] });
  expect(
    await screen.findByRole('heading', { name: 'Quadra Central' }),
  ).toBeInTheDocument();
  expect(list).toHaveBeenCalledWith(
    'token',
    expect.objectContaining({ arenaId: '1' }),
  );
  await user.click(
    screen.getByRole('button', { name: 'Explorar outras arenas' }),
  );
  await waitFor(() =>
    expect(list).toHaveBeenCalledWith(
      'token',
      expect.objectContaining({ arenaId: undefined }),
    ),
  );
});

it('opens details immediately and offers external directions without a Routes API call', async () => {
  const user = userEvent.setup();
  vi.spyOn(api, 'listArenas').mockResolvedValue(page);
  renderWithProviders(<ArenaDiscovery />);
  await user.click(
    await screen.findByRole('button', { name: 'Marcador Quadra Central' }),
  );
  expect(
    await screen.findByRole('dialog', { name: 'Detalhes da quadra' }),
  ).toBeInTheDocument();
  const waze = new URL(
    screen.getByRole('link', { name: /Abrir no Waze/ }).getAttribute('href')!,
  );
  expect(waze.hostname).toBe('waze.com');
  expect(waze.searchParams.get('ll')).toBe('-23,-46');
  expect(waze.searchParams.get('navigate')).toBe('yes');
  const google = new URL(
    screen.getByRole('link', { name: 'Google Maps' }).getAttribute('href')!,
  );
  expect(google.searchParams.get('destination')).toBe('-23,-46');
  expect(google.searchParams.has('origin')).toBe(false);
  await user.click(screen.getByRole('button', { name: 'Close' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
});

it('reuses catalog queries and discovery state when returning from another page', async () => {
  const user = userEvent.setup();
  const list = vi.spyOn(api, 'listArenas').mockResolvedValue(page);
  const first = renderWithProviders(<ArenaDiscovery />);
  first.queryClient.setQueryDefaults(['arenaDiscoveryState'], {
    gcTime: 30 * 60_000,
  });
  await user.click(
    await screen.findByRole('button', { name: 'Buscar nesta região' }),
  );
  await screen.findByText(/21 arenas encontradas em até 5 km/);
  await user.click(screen.getByRole('button', { name: 'Lista' }));
  const calls = list.mock.calls.length;
  first.unmount();
  renderWithProviders(<ArenaDiscovery />, { queryClient: first.queryClient });
  expect(screen.getByRole('button', { name: 'Lista' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(screen.getByLabelText('Raio')).toHaveValue('5');
  await user.click(screen.getByRole('button', { name: 'Mapa' }));
  expect(list).toHaveBeenCalledTimes(calls);
});

it('shows arenas from every API page within the selected radius on the map', async () => {
  const user = userEvent.setup();
  const farArena = {
    ...arena,
    id: '99',
    address: 'Quadra a 90 km',
    distanceKm: 90,
  };
  vi.spyOn(api, 'listArenas').mockImplementation(async (_token, filters) => {
    const options = typeof filters === 'object' ? filters : {};
    if (!options?.lat) return { ...page, hasNextPage: false };
    return {
      ...page,
      items: options.page === 2 ? [farArena] : [arena],
      hasNextPage: options.page !== 2,
    };
  });
  renderWithProviders(<ArenaDiscovery />);
  await user.click(screen.getByRole('button', { name: 'Buscar nesta região' }));
  await user.selectOptions(screen.getByLabelText('Raio'), '100');
  expect(
    await screen.findByRole('button', { name: 'Marcador Quadra a 90 km' }),
  ).toBeVisible();
  expect(
    screen.getByRole('button', { name: 'Marcador Quadra Central' }),
  ).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Próxima' }),
  ).not.toBeInTheDocument();
});
