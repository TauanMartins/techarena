import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { teamsApi } from '../features/teams/api/teams.api';
import { renderWithProviders } from '../test/test-utils';
import { TeamsPage } from './TeamsPage';

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({
    session: { access_token: 'token', user: { id: 'user-1' } },
  }),
}));

const emptyPage = {
  items: [],
  total: 0,
  totalPages: 0,
  page: 1,
  limit: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

afterEach(() => vi.restoreAllMocks());

describe('TeamsPage', () => {
  it('validates and creates a team through the user-facing form', async () => {
    const user = userEvent.setup();
    vi.spyOn(teamsApi, 'list').mockResolvedValue(emptyPage as never);
    vi.spyOn(teamsApi, 'listMine').mockResolvedValue(emptyPage as never);
    vi.spyOn(teamsApi, 'listRequests').mockResolvedValue(emptyPage as never);
    const create = vi
      .spyOn(teamsApi, 'create')
      .mockResolvedValue({ id: 'team-1' } as never);
    renderWithProviders(<TeamsPage />);

    await user.click(screen.getByRole('button', { name: 'Criar equipe' }));
    const dialog = screen.getByRole('dialog');
    await user.click(
      within(dialog).getByRole('button', { name: 'Criar equipe' }),
    );
    expect(
      await within(dialog).findByText('Informe o nome da equipe.'),
    ).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Nome'), 'Equipe Aurora');
    await user.type(
      within(dialog).getByLabelText('Descrição'),
      'Atletas da região',
    );
    await user.click(
      within(dialog).getByRole('button', { name: 'Criar equipe' }),
    );
    await vi.waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        'token',
        'Equipe Aurora',
        'Atletas da região',
      ),
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Equipe criada.',
    );
  });

  it('searches the catalog and requests membership in a team', async () => {
    const user = userEvent.setup();
    vi.spyOn(teamsApi, 'list').mockResolvedValue({
      ...emptyPage,
      items: [
        {
          id: 'team-2',
          name: 'Vôlei da Praia',
          description: null,
          image: null,
          createdAt: '2026-01-01',
        },
      ],
    } as never);
    vi.spyOn(teamsApi, 'listMine').mockResolvedValue(emptyPage as never);
    vi.spyOn(teamsApi, 'listRequests').mockResolvedValue(emptyPage as never);
    const request = vi
      .spyOn(teamsApi, 'requestToJoin')
      .mockResolvedValue({ success: true } as never);
    renderWithProviders(<TeamsPage />);

    expect(teamsApi.list).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('heading', { name: 'Vôlei da Praia' }),
    ).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Buscar equipes'), 'praia');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    await user.click(
      await screen.findByRole('button', { name: 'Solicitar participação' }),
    );
    await vi.waitFor(() =>
      expect(request).toHaveBeenCalledWith('token', 'team-2'),
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Solicitação enviada para Vôlei da Praia.',
    );
  });

  it('opens captain details, searches athletes, invites them and handles membership requests', async () => {
    const user = userEvent.setup();
    const myTeam = {
      id: 'team-1',
      name: 'Equipe Aurora',
      description: null,
      image: null,
      joinedAt: null,
      role: 'captain',
    };
    const requestRow = {
      id: 'request-1',
      teamId: 'team-1',
      teamName: 'Equipe Aurora',
      userId: 'athlete-2',
      userName: 'Bia',
      createdBy: 'captain',
      kind: 'request' as const,
      status: 'pending' as const,
      createdAt: '2026-01-01',
    };
    vi.spyOn(teamsApi, 'list').mockResolvedValue(emptyPage as never);
    vi.spyOn(teamsApi, 'listMine').mockResolvedValue({
      ...emptyPage,
      items: [myTeam],
    } as never);
    vi.spyOn(teamsApi, 'listRequests').mockResolvedValue(emptyPage as never);
    vi.spyOn(teamsApi, 'listMembers').mockResolvedValue(emptyPage as never);
    vi.spyOn(teamsApi, 'listTeamRequests').mockResolvedValue({
      ...emptyPage,
      items: [requestRow],
    } as never);
    vi.spyOn(teamsApi, 'searchUsers').mockResolvedValue({
      ...emptyPage,
      items: [{ id: 'athlete-3', name: 'Caio', username: 'caio', image: null }],
    } as never);
    const invite = vi
      .spyOn(teamsApi, 'invite')
      .mockResolvedValue({ success: true } as never);
    const decide = vi
      .spyOn(teamsApi, 'decideRequest')
      .mockResolvedValue({ success: true } as never);
    renderWithProviders(<TeamsPage />);

    await user.click(
      await screen.findByRole('button', { name: 'Detalhes e solicitações' }),
    );
    const dialog = screen.getByRole('dialog');
    await within(dialog).findByText('Convidar atletas');
    await user.type(
      within(dialog).getByLabelText('Buscar atleta para convidar'),
      'caio',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Buscar' }));
    await user.click(await screen.findByRole('button', { name: 'Convidar' }));
    await vi.waitFor(() =>
      expect(invite).toHaveBeenCalledWith('token', 'team-1', 'athlete-3'),
    );
    await user.click(screen.getByRole('button', { name: 'Aceitar' }));
    await vi.waitFor(() =>
      expect(decide).toHaveBeenCalledWith(
        'token',
        'team-1',
        'athlete-2',
        'accept',
      ),
    );
    await user.click(
      within(dialog).getByRole('button', { name: 'Ir para conversa' }),
    );
  });
});
