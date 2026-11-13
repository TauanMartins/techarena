import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ChatMessage } from '../api/message-mapper';
import { MessageList } from './MessageList';

const message: ChatMessage = {
  id: 'message-1',
  userId: 'other',
  name: 'Bia',
  text: 'Vamos jogar?',
  createdAt: '2026-11-03T10:00:00Z',
};
const endRef = createRef<HTMLDivElement>();
const listRef = createRef<HTMLDivElement>();
const props = {
  messages: [] as ChatMessage[],
  userId: 'me',
  connection: 'connecting',
  chatError: null,
  hasOlderMessages: false,
  loadingHistory: false,
  onLoadOlder: vi.fn(),
  listRef,
  endRef,
};

describe('MessageList', () => {
  it('shows connection, empty, and connection-error states', () => {
    const { rerender } = render(<MessageList {...props} />);
    expect(
      screen.getByText('Conectando e carregando o histórico...'),
    ).toBeInTheDocument();
    rerender(
      <MessageList
        {...props}
        connection="connected"
      />,
    );
    expect(
      screen.getByText(
        'Nenhuma mensagem ainda. Envie a primeira para iniciar a conversa.',
      ),
    ).toBeInTheDocument();
    rerender(
      <MessageList
        {...props}
        connection="error"
      />,
    );
    expect(
      screen.getByText('Não foi possível abrir esta conversa.'),
    ).toBeInTheDocument();
  });

  it('loads older history, displays own and incoming messages, and reports chat errors', () => {
    const onLoadOlder = vi.fn();
    const own: ChatMessage = {
      ...message,
      id: 'mine',
      userId: 'me',
      name: 'Eu',
      text: 'Combinado',
    };
    const { rerender } = render(
      <MessageList
        {...props}
        messages={[message, own]}
        connection="connected"
        hasOlderMessages
        onLoadOlder={onLoadOlder}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Carregar mensagens anteriores' }),
    );
    expect(onLoadOlder).toHaveBeenCalledOnce();
    expect(screen.getByText('Bia')).toBeInTheDocument();
    expect(screen.getByText('Vamos jogar?')).toBeInTheDocument();
    expect(screen.getByText('Combinado')).toBeInTheDocument();
    rerender(
      <MessageList
        {...props}
        messages={[message]}
        connection="connected"
        chatError="Falha de conexão"
      />,
    );
    expect(screen.getByText('Falha de conexão')).toBeInTheDocument();
  });

  it('disables history pagination while it is already loading', () => {
    render(
      <MessageList
        {...props}
        hasOlderMessages
        loadingHistory
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Carregando...' }),
    ).toBeDisabled();
  });
});
