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
    expect(screen.getByText('Pessoa online agora')).toBeInTheDocument();
    expect(screen.getByText('Sua conexão: indisponível')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Voltar para conversas' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Detalhes da conversa' }),
    );
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
    expect(screen.getByText('Verificando presença...')).toBeInTheDocument();
    expect(screen.getByText('Sua conexão: conectando...')).toBeInTheDocument();
  });
});
