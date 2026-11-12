import Button from 'react-bootstrap/Button';
import type { RefObject } from 'react';
import { ErrorState, LoadingState } from '../../../components/ui/Feedback';
import type { ChatMessage } from '../api/message-mapper';

export function MessageList({
  messages,
  userId,
  connection,
  chatError,
  hasOlderMessages,
  loadingHistory,
  onLoadOlder,
  listRef,
  endRef,
}: {
  messages: ChatMessage[];
  userId: string;
  connection: string;
  chatError: string | null;
  hasOlderMessages: boolean;
  loadingHistory: boolean;
  onLoadOlder: () => void;
  listRef: RefObject<HTMLDivElement | null>;
  endRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <>
      <div
        className="d-flex flex-column gap-3 flex-grow-1 overflow-auto p-3 bg-body-tertiary"
        aria-live="polite"
        ref={listRef}
      >
        {hasOlderMessages && (
          <Button
            variant="outline-secondary"
            size="sm"
            className="align-self-center"
            disabled={loadingHistory}
            onClick={onLoadOlder}
          >
            {loadingHistory ? 'Carregando...' : 'Carregar mensagens anteriores'}
          </Button>
        )}
        {connection === 'connecting' && !messages.length && (
          <LoadingState label="Conectando e carregando o histórico..." />
        )}
        {connection === 'error' && !messages.length && (
          <div className="m-auto text-center small text-body-secondary">
            Não foi possível abrir esta conversa.
          </div>
        )}
        {connection === 'connected' && !messages.length && (
          <div className="m-auto text-center small text-body-secondary">
            Nenhuma mensagem ainda. Envie a primeira para iniciar a conversa.
          </div>
        )}
        {messages.map((message) => {
          const own = message.userId === userId;
          return (
            <div
              className={`d-flex flex-column gap-1 w-75 flex-shrink-0 ${own ? 'align-self-end' : 'align-self-start'}`}
              key={message.id}
            >
              {!own && (
                <span className="small text-body-secondary">
                  {message.name}
                </span>
              )}
              <div
                className={`d-flex flex-column gap-1 p-3 border rounded-4 text-break ${own ? 'bg-primary-subtle text-primary-emphasis border-primary-subtle' : 'bg-body text-body'}`}
              >
                <span>{message.text}</span>
                <time className="small align-self-end">
                  {new Date(message.createdAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      {chatError && (
        <div className="p-3">
          <ErrorState message={chatError} />
        </div>
      )}
    </>
  );
}
