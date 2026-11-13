import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { chatApi } from '../features/chat/api/chat.api';
import { renderWithProviders } from '../test/test-utils';
import { ChatPage } from './ChatPage';

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({
    session: { access_token: 'token', user: { id: 'user-1' } },
    profile: { name: 'Ana' },
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

describe('ChatPage', () => {
  it('loads the inbox and explains how to start a conversation when it is empty', async () => {
    vi.spyOn(chatApi, 'friends').mockResolvedValue({
      friends: emptyPage,
      requestedFriends: emptyPage,
      receivedFriends: emptyPage,
    } as never);
    vi.spyOn(chatApi, 'teams').mockResolvedValue(emptyPage as never);
    vi.spyOn(chatApi, 'appointments').mockResolvedValue(emptyPage as never);
    renderWithProviders(
      <Routes>
        <Route
          path="/chat"
          element={<ChatPage />}
        />
        <Route
          path="/chat/:kind/:id"
          element={<ChatPage />}
        />
      </Routes>,
      { initialEntries: ['/chat'] },
    );

    expect(
      await screen.findByText(/Adicione amizades, entre em equipes/),
    ).toBeInTheDocument();
    expect(screen.getByText('Escolha uma conversa')).toBeInTheDocument();
  });

  it('opens a direct conversation, shows details, and returns to the inbox', async () => {
    const user = userEvent.setup();
    vi.spyOn(chatApi, 'friends').mockResolvedValue({
      friends: {
        ...emptyPage,
        items: [
          {
            id: 'friend-1',
            status: 'accepted',
            user: { id: 'friend-1', name: 'Bia', username: 'bia', image: null },
          },
        ],
      },
      requestedFriends: emptyPage,
      receivedFriends: emptyPage,
    } as never);
    vi.spyOn(chatApi, 'teams').mockResolvedValue(emptyPage as never);
    vi.spyOn(chatApi, 'appointments').mockResolvedValue(emptyPage as never);
    renderWithProviders(
      <Routes>
        <Route
          path="/chat"
          element={<ChatPage />}
        />
        <Route
          path="/chat/:kind/:id"
          element={<ChatPage />}
        />
      </Routes>,
      { initialEntries: ['/chat'] },
    );

    await user.click(await screen.findByRole('button', { name: /Bia/ }));
    expect(
      await screen.findByText('Verificando presença...'),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Detalhes da conversa' }),
    );
    expect(await screen.findByText('Detalhes da conversa')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await user.click(
      screen.getByRole('button', { name: 'Voltar para conversas' }),
    );
    expect(await screen.findByText('Escolha uma conversa')).toBeInTheDocument();
  });
});
