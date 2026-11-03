import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { teamsApi } from '../features/teams/api/teams.api';
import { renderWithProviders } from '../test/test-utils';
import { TeamsPage } from './TeamsPage';

vi.mock('../auth/useAuth', () => ({ useAuth: () => ({ session: { access_token: 'token', user: { id: 'user-1' } } }) }));

const emptyPage = { items: [], total: 0, totalPages: 0, page: 1, limit: 20, hasNextPage: false, hasPreviousPage: false };

afterEach(() => vi.restoreAllMocks());

describe('TeamsPage', () => {
  it('validates and creates a team through the user-facing form', async () => {
    const user = userEvent.setup();
    vi.spyOn(teamsApi, 'list').mockResolvedValue(emptyPage as never);
    vi.spyOn(teamsApi, 'listMine').mockResolvedValue(emptyPage as never);
    vi.spyOn(teamsApi, 'listRequests').mockResolvedValue(emptyPage as never);
    const create = vi.spyOn(teamsApi, 'create').mockResolvedValue({ id: 'team-1' } as never);
    renderWithProviders(<TeamsPage />);

    await user.click(screen.getByRole('button', { name: 'Criar equipe' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Criar equipe' }));
    expect(await within(dialog).findByText('Informe o nome da equipe.')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Nome'), 'Equipe Aurora');
    await user.type(within(dialog).getByLabelText('Descrição'), 'Atletas da região');
    await user.click(within(dialog).getByRole('button', { name: 'Criar equipe' }));
    await vi.waitFor(() => expect(create).toHaveBeenCalledWith('token', 'Equipe Aurora', 'Atletas da região'));
    expect(await screen.findByRole('status')).toHaveTextContent('Equipe criada.');
  });
});
