import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LeagueDetailsPage } from './LeagueDetailsPage';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LeaguePage } from './LeaguePage';
import { api } from '../lib/api-client';

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({
    session: {
      access_token: 'test-token',
      user: { id: 'test-user' },
    },
  }),
}));

vi.mock('../lib/api-client', () => ({
  api: {
    listLeagues: vi.fn(),
    getSports: vi.fn(),
    listMyTeams: vi.fn(),
    getLeague: vi.fn(),
    getLeagueArenas: vi.fn(),
    getLeagueAvailability: vi.fn(),
    listLeagueTeamInvitations: vi.fn(),
    listTeams: vi.fn(),
    inviteLeagueTeam: vi.fn(),
    respondToLeagueTeamInvitation: vi.fn(),
    createLeagueMatch: vi.fn(),
    updateLeague: vi.fn(),
    setLeagueStatus: vi.fn(),
  },
}));

const league = {
  id: '1',
  name: 'Liga de teste',
  description: 'Descrição',
  image: null,
  ownerId: 'owner-1',
  ownerName: 'Organizador',
  sportId: '2',
  sportName: 'Futebol',
  tournamentFormat: 'round_robin' as const,
  status: 'open' as const,
  groupCount: 2,
  qualifiersPerGroup: 2,
  createdAt: '2026-10-29T00:00:00.000Z',
  teamCount: 0,
  matchCount: 0,
  completedMatchCount: 0,
  isOwner: true,
};

describe('LeaguePage', () => {
  afterEach(cleanup);

  function renderLeaguePage(path = '/ligas') {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route
              path="/ligas"
              element={<LeaguePage />}
            />
            <Route
              path="/ligas/:leagueId"
              element={<LeagueDetailsPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.listLeagues).mockResolvedValue({ items: [league] });
    vi.mocked(api.listLeagueTeamInvitations).mockResolvedValue({ items: [] });
    vi.mocked(api.getSports).mockResolvedValue({
      items: [],
      total: 0,
      totalPages: 0,
      page: 1,
      limit: 50,
      hasNextPage: false,
      hasPreviousPage: false,
    });
    vi.mocked(api.listMyTeams).mockResolvedValue({
      items: [],
      total: 0,
      totalPages: 0,
      page: 1,
      limit: 50,
      hasNextPage: false,
      hasPreviousPage: false,
    });
    vi.mocked(api.getLeague).mockResolvedValue({
      league,
      teams: [],
      invitations: [],
      matches: [],
      standings: [],
      myCaptainTeamIds: [],
    });
    vi.mocked(api.getLeagueArenas).mockResolvedValue({ items: [] });
    vi.mocked(api.createLeagueMatch).mockResolvedValue({ success: true });
    vi.mocked(api.listTeams).mockResolvedValue({
      items: [],
      total: 0,
      totalPages: 0,
      page: 1,
      limit: 20,
      hasNextPage: false,
      hasPreviousPage: false,
    });
    vi.mocked(api.inviteLeagueTeam).mockResolvedValue({ success: true });
    vi.mocked(api.respondToLeagueTeamInvitation).mockResolvedValue({
      success: true,
    });
  });

  it('opens one league on its own route without fetching details on the catalog', async () => {
    renderLeaguePage();
    await screen.findByRole('button', { name: 'Ver liga' });
    expect(api.getLeague).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Ver liga' }));
    await screen.findByRole('heading', { name: 'Liga de teste' });
    expect(api.getLeague).toHaveBeenCalledWith('test-token', '1');
    expect(
      screen.queryByRole('button', { name: 'Ver liga' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: /Voltar para ligas/ }));
    expect(
      await screen.findByRole('button', { name: 'Ver liga' }),
    ).toBeInTheDocument();
  });

  it('opens and closes the league creation form and surfaces validation errors', async () => {
    renderLeaguePage();
    await screen.findByRole('button', { name: 'Ver liga' });
    fireEvent.click(screen.getByRole('button', { name: 'Criar liga' }));
    expect(
      await screen.findByRole('heading', { name: 'Nova liga' }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Criar liga' }).at(-1)!,
    );
    expect(
      await screen.findByText(/Informe o nome da liga/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(
      screen.queryByRole('heading', { name: 'Nova liga' }),
    ).not.toBeInTheDocument();
  });

  it('updates league settings and confirms an owner status change', async () => {
    vi.mocked(api.updateLeague).mockResolvedValue({ success: true });
    vi.mocked(api.setLeagueStatus).mockResolvedValue({ success: true });
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    renderLeaguePage('/ligas/1');
    await screen.findByRole('button', { name: 'Editar liga' });
    fireEvent.click(await screen.findByRole('button', { name: 'Editar liga' }));
    expect(
      screen.getByRole('button', { name: 'Salvar configurações' }),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Liga editada' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Salvar configurações' }),
    );
    await waitFor(() =>
      expect(api.updateLeague).toHaveBeenCalledWith(
        'test-token',
        '1',
        expect.objectContaining({ name: 'Liga editada' }),
      ),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Editar liga' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar liga' }));
    await waitFor(() =>
      expect(api.setLeagueStatus).toHaveBeenCalledWith(
        'test-token',
        '1',
        'canceled',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Fechar aviso' }));
    expect(screen.queryByText('Liga cancelada.')).not.toBeInTheDocument();
  });

  it('lets a league organizer search for and invite another team', async () => {
    vi.mocked(api.listTeams).mockResolvedValue({
      items: [
        {
          id: 'team-2',
          name: 'Equipe visitante',
          description: null,
          image: null,
          createdAt: '2026-10-29T00:00:00.000Z',
        },
      ],
      total: 1,
      totalPages: 1,
      page: 1,
      limit: 20,
      hasNextPage: false,
      hasPreviousPage: false,
    });
    renderLeaguePage('/ligas/1');

    await screen.findByRole('heading', { name: 'Convidar outra equipe' });
    fireEvent.change(screen.getByLabelText('Buscar equipe para convidar'), {
      target: { value: 'visitante' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    await screen.findByRole('option', { name: 'Equipe visitante' });
    fireEvent.change(screen.getByLabelText('Equipe para convidar'), {
      target: { value: 'team-2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Convidar' }));

    await waitFor(() =>
      expect(api.inviteLeagueTeam).toHaveBeenCalledWith(
        'test-token',
        '1',
        'team-2',
      ),
    );
    expect(
      await screen.findByText('Convite enviado ao capitão da equipe.'),
    ).toBeInTheDocument();
  });

  it('allows an organizer to schedule a match between registered teams', async () => {
    vi.mocked(api.getLeague).mockResolvedValue({
      league: { ...league, teamCount: 2 },
      teams: [
        {
          id: 'team-1',
          name: 'Equipe da casa',
          image: null,
          captainName: 'Capitão 1',
          groupNumber: null,
        },
        {
          id: 'team-2',
          name: 'Equipe visitante',
          image: null,
          captainName: 'Capitão 2',
          groupNumber: null,
        },
      ],
      invitations: [],
      matches: [],
      standings: [],
      myCaptainTeamIds: [],
    });
    vi.mocked(api.getLeagueArenas).mockResolvedValue({
      items: [{ id: 'arena-1', address: 'Arena Central', image: null }],
    });
    vi.mocked(api.getLeagueAvailability).mockResolvedValue({
      items: [{ id: 'schedule-1', horary: '20:00:00' }],
    });
    renderLeaguePage('/ligas/1');

    await screen.findByRole('heading', { name: 'Agendar partida' });
    await screen.findAllByRole('option', { name: '20:00' });
    fireEvent.change(screen.getByLabelText('Equipe da casa'), {
      target: { value: 'team-1' },
    });
    fireEvent.change(screen.getByLabelText('Equipe visitante'), {
      target: { value: 'team-2' },
    });
    fireEvent.change(screen.getByLabelText('Horário da partida'), {
      target: { value: 'schedule-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Agendar partida' }));

    await waitFor(() =>
      expect(api.createLeagueMatch).toHaveBeenCalledWith(
        'test-token',
        '1',
        expect.objectContaining({
          homeTeamId: 'team-1',
          awayTeamId: 'team-2',
          arenaId: 'arena-1',
          scheduleId: 'schedule-1',
        }),
      ),
    );
  });

  it('lets a team captain accept a league invitation', async () => {
    vi.mocked(api.listLeagueTeamInvitations).mockResolvedValue({
      items: [
        {
          id: 'invitation-1',
          leagueId: '1',
          leagueName: 'Liga de teste',
          teamId: 'team-2',
          teamName: 'Equipe visitante',
          invitedAt: '2026-10-29T00:00:00.000Z',
        },
      ],
    });
    renderLeaguePage();

    fireEvent.click(await screen.findByRole('button', { name: 'Aceitar' }));

    await waitFor(() =>
      expect(api.respondToLeagueTeamInvitation).toHaveBeenCalledWith(
        'test-token',
        'invitation-1',
        'accept',
      ),
    );
    expect(
      await screen.findByText(
        'Convite aceito. A equipe está inscrita na liga.',
      ),
    ).toBeInTheDocument();
  });
});
