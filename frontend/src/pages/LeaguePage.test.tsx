import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LeaguePage } from './LeaguePage';
import { api } from '../shared/api';

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ session: { access_token: 'test-token' } }),
}));

vi.mock('../shared/api', () => ({
  api: {
    listLeagues: vi.fn(),
    getSports: vi.fn(),
    listMyTeams: vi.fn(),
    getLeague: vi.fn(),
    getLeagueArenas: vi.fn(),
    getLeagueAvailability: vi.fn(),
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
  createdAt: '2026-10-29T00:00:00.000Z',
  teamCount: 0,
  matchCount: 0,
  completedMatchCount: 0,
  isOwner: true,
};

describe('LeaguePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.listLeagues).mockResolvedValue({ items: [league] });
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
      matches: [],
      standings: [],
      myCaptainTeamIds: [],
    });
    vi.mocked(api.getLeagueArenas).mockResolvedValue({ items: [] });
  });

  it('reloads details when the already selected league is clicked', async () => {
    render(<LeaguePage />);

    await screen.findByRole('button', { name: 'Ver liga' });
    await waitFor(() => expect(api.getLeague).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'Ver liga' }));

    await waitFor(() => expect(api.getLeague).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(api.getLeague).toHaveBeenCalledTimes(2));
    expect(screen.getAllByRole('heading', { name: 'Liga de teste' })).toHaveLength(2);
  });
});
