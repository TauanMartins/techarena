import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { useChatThread } from '../hooks/useChatThread';
import { ConversationHeader } from './ConversationHeader';

describe('ConversationHeader', () => {
  it('shows direct presence and invokes navigation, detail, and retry actions', () => {
    const onBack = vi.fn();
    const onDetails = vi.fn();
    const retry = vi.fn();
    const thread = {
      connection: 'error',
      onlineUserIds: ['friend-1'],
      presenceSynced: true,
      retry,
    } as unknown as ReturnType<typeof useChatThread>;
    render(
      <ConversationHeader
        conversation={{
          id: 'friend-1',
          otherUserId: 'friend-1',
          kind: 'direct',
          label: 'Bia',
        }}
        thread={thread}
        userId="me"
        onBack={onBack}
        onDetails={onDetails}
      />,
    );
    expect(screen.getByText('Presença indisponível')).toBeInTheDocument();
    expect(
      screen.getByText('Chat indisponível. Tente reconectar.'),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Voltar para conversas' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Detalhes de Bia' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Reconectar conversa' }),
    );
    expect(onBack).toHaveBeenCalledOnce();
    expect(onDetails).toHaveBeenCalledOnce();
    expect(retry).toHaveBeenCalledOnce();
  });

  it('reports room presence while synchronization is pending', () => {
    const thread = {
      connection: 'connecting',
      onlineUserIds: ['user-1', 'user-2'],
      presenceSynced: false,
    } as unknown as ReturnType<typeof useChatThread>;
    render(
      <ConversationHeader
        conversation={{ id: 'team-1', kind: 'team', label: 'Equipe' }}
        thread={thread}
        userId="user-1"
        onBack={vi.fn()}
        onDetails={vi.fn()}
      />,
    );
    expect(screen.getByText('Presença indisponível')).toBeInTheDocument();
    expect(screen.getByText('Conectando ao chat…')).toBeInTheDocument();
  });
});

it('prioritizes typing, hides successful connection noise and reacts to lost internet', () => {
  const thread = {
    connection: 'connected',
    presenceSynced: true,
    onlineUserIds: ['friend'],
    typingPeople: [
      { id: 'friend', name: 'Bia', image: null, expiresAt: Date.now() + 5000 },
    ],
  } as unknown as ReturnType<typeof useChatThread>;
  const props = {
    conversation: {
      id: 'friend',
      otherUserId: 'friend',
      kind: 'direct' as const,
      label: 'Bia',
    },
    thread,
    userId: 'me',
    onBack: vi.fn(),
    onDetails: vi.fn(),
  };
  const { rerender } = render(<ConversationHeader {...props} />);
  expect(screen.getByText('Digitando…')).toBeInTheDocument();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  rerender(
    <ConversationHeader
      {...props}
      thread={{ ...thread, typingPeople: [] }}
    />,
  );
  expect(screen.getByText('Online')).toBeInTheDocument();
  rerender(
    <ConversationHeader
      {...props}
      thread={{ ...thread, typingPeople: [], onlineUserIds: [] }}
    />,
  );
  expect(screen.getByText('Offline')).toBeInTheDocument();
  const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  fireEvent(window, new Event('offline'));
  expect(screen.getByRole('status')).toHaveTextContent('Sem internet');
  expect(screen.getByText('Presença indisponível')).toBeInTheDocument();
  online.mockRestore();
});
