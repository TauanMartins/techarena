import Button from 'react-bootstrap/Button';
import { IconButton } from '../../../components/ui/IconButton';
import type { Conversation } from '../types/conversation.types';
import type { useChatThread } from '../hooks/useChatThread';
import { ConversationAvatar } from './ConversationAvatar';

type Thread = ReturnType<typeof useChatThread>;
export function ConversationHeader({
  conversation,
  thread,
  userId,
  onBack,
  onDetails,
}: {
  conversation: Conversation;
  thread: Thread;
  userId: string;
  onBack: () => void;
  onDetails: () => void;
}) {
  const otherOnline = Boolean(
    conversation.otherUserId &&
    conversation.otherUserId.toLowerCase() !== userId.toLowerCase() &&
    thread.onlineUserIds.includes(conversation.otherUserId),
  );
  const presence = !thread.presenceSynced
    ? 'Verificando presença...'
    : conversation.kind === 'direct'
      ? otherOnline
        ? 'Pessoa online agora'
        : 'Pessoa offline'
      : `${Math.max(0, thread.onlineUserIds.filter((id) => id !== userId).length)} outras pessoas online`;
  const connection =
    thread.connection === 'connected'
      ? 'Sua conexão: conectada'
      : thread.connection === 'connecting'
        ? 'Sua conexão: conectando...'
        : thread.connection === 'error'
          ? 'Sua conexão: indisponível'
          : 'Sua conexão: desconectada';
  return (
    <header className="d-flex flex-wrap flex-sm-nowrap align-items-center gap-2 p-3 border-bottom">
      <IconButton
        icon="bi-arrow-left"
        label="Voltar para conversas"
        className="d-md-none"
        onClick={onBack}
      />
      <ConversationAvatar conversation={conversation} />
      <div className="d-flex flex-column flex-grow-1 overflow-hidden">
        <strong className="text-truncate">{conversation.label}</strong>
        <small className="text-body-secondary text-truncate">{presence}</small>
      </div>
      <span
        className={`d-none d-lg-flex align-items-center gap-2 small ms-auto ${thread.connection === 'connected' ? 'text-success-emphasis' : thread.connection === 'error' ? 'text-danger-emphasis' : 'text-body-secondary'}`}
      >
        <i className="bi bi-circle-fill" />
        {connection}
      </span>
      <Button
        size="sm"
        variant="outline-secondary"
        onClick={onDetails}
        aria-label="Detalhes da conversa"
      >
        <i
          className="bi bi-info-circle"
          aria-hidden="true"
        />
        <span className="d-none d-lg-inline ms-2">Detalhes</span>
      </Button>
      {thread.connection === 'error' && (
        <IconButton
          icon="bi-arrow-clockwise"
          label="Reconectar conversa"
          onClick={thread.retry}
        />
      )}
    </header>
  );
}
