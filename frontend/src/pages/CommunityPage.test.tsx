import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test/test-utils';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { communityApi } from '../features/community/api/community.api';
import { CommunityPage } from './CommunityPage';

vi.mock('../auth/useAuth', () => ({ useAuth: () => ({ session: { access_token: 'token', user: { id: 'me' } } }) }));

const page = (items: unknown[] = []) => ({ items, total: items.length, totalPages: 1, page: 1, limit: 20, hasNextPage: false, hasPreviousPage: false });
const groups = { friends: page(), requestedFriends: page(), receivedFriends: page() };

afterEach(() => vi.restoreAllMocks());

describe('CommunityPage', () => {
  it('validates directory search, excludes the signed-in athlete, and sends a friend request', async () => {
    const user = userEvent.setup();
    vi.spyOn(communityApi, 'listFriends').mockResolvedValue(groups as never);
    const search = vi.spyOn(communityApi, 'searchUsers').mockResolvedValue(page([
      { id: 'me', name: 'Eu', username: 'eu', image: null },
      { id: 'athlete-1', name: 'Ana', username: 'ana', image: null },
    ]) as never);
    const request = vi.spyOn(communityApi, 'requestFriend').mockResolvedValue({} as never);
    renderWithProviders(<CommunityPage />);

    expect(await screen.findByText('Busque atletas da comunidade')).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'Buscar atletas' }), 'a');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByText('Digite pelo menos 2 caracteres para buscar atletas.')).toBeInTheDocument();
    expect(search).not.toHaveBeenCalled();

    const input = screen.getByRole('textbox', { name: 'Buscar atletas' });
    await user.clear(input);
    await user.type(input, ' ana ');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByRole('button', { name: 'Adicionar' })).toBeInTheDocument();
    expect(search).toHaveBeenLastCalledWith('token', 'ana');
    expect(screen.queryByText('Eu')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Adicionar' }));
    await waitFor(() => expect(request).toHaveBeenCalledWith('token', 'athlete-1'));
    expect(await screen.findByRole('status')).toHaveTextContent('Solicitação de amizade enviada.');
  });
});
