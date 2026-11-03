import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { chatApi } from '../features/chat/api/chat.api';
import { renderWithProviders } from '../test/test-utils';
import { ChatPage } from './ChatPage';

vi.mock('../auth/useAuth', () => ({ useAuth: () => ({
  session: { access_token: 'token', user: { id: 'user-1' } },
  profile: { name: 'Ana' },
}) }));

const emptyPage = { items: [], total: 0, totalPages: 0, page: 1, limit: 20, hasNextPage: false, hasPreviousPage: false };

afterEach(() => vi.restoreAllMocks());

describe('ChatPage', () => {
  it('loads the inbox and explains how to start a conversation when it is empty', async () => {
    vi.spyOn(chatApi, 'friends').mockResolvedValue({ friends: emptyPage, requestedFriends: emptyPage, receivedFriends: emptyPage } as never);
    vi.spyOn(chatApi, 'teams').mockResolvedValue(emptyPage as never);
    vi.spyOn(chatApi, 'appointments').mockResolvedValue(emptyPage as never);
    renderWithProviders(<ChatPage />, { initialEntries: ['/chat'] });

    expect(await screen.findByText(/Adicione amizades, entre em equipes/)).toBeInTheDocument();
    expect(screen.getByText('Escolha uma conversa')).toBeInTheDocument();
  });
});
