import Button from 'react-bootstrap/Button';
import { IconButton } from '../../../components/ui/IconButton';
import { useNetworkOnline } from '../../../shared/hooks/useNetworkOnline';
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
  const networkOnline = useNetworkOnline();
  const connected = networkOnline && thread.connection === 'connected';
  const typing = connected ? (thread.typingPeople ?? []) : [];
  const otherOnline = Boolean(
    conversation.otherUserId &&
    thread.onlineUserIds.includes(conversation.otherUserId),
  );
  const presence =
    !connected || !thread.presenceSynced
      ? 'Presença indisponível'
      : typing.length
        ? conversation.kind === 'direct'
          ? 'Digitando…'
          : `${typing.map((person) => person.name).join(', ')} digitando…`
        : conversation.kind === 'direct'
          ? otherOnline
            ? 'Online'
            : 'Offline'
          : `${thread.onlineUserIds.filter((id) => id !== userId).length} outras pessoas online`;
  const connectionNotice = !networkOnline
    ? 'Sem internet. Verifique sua conexão.'
    : thread.connection === 'connecting'
      ? 'Conectando ao chat…'
      : thread.connection !== 'connected'
        ? 'Chat indisponível. Tente reconectar.'
        : null;
  return (
    <header className="border-bottom flex-shrink-0">
      <div className="d-flex align-items-center gap-2 p-2 p-md-3">
        <IconButton
          icon="bi-arrow-left"
          label="Voltar para conversas"
          className="d-md-none"
          onClick={onBack}
        />
        <Button
          variant="link"
          className="d-flex align-items-center gap-2 text-start text-body text-decoration-none flex-grow-1 overflow-hidden p-0"
          onClick={onDetails}
          aria-label={`Detalhes de ${conversation.label}`}
        >
          <ConversationAvatar conversation={conversation} />
          <span className="d-flex flex-column overflow-hidden">
            <strong className="text-truncate">{conversation.label}</strong>
            <small
              className={`text-truncate ${typing.length ? 'text-primary' : 'text-body-secondary'}`}
            >
              {presence}
            </small>
          </span>
        </Button>
        {networkOnline && thread.connection === 'error' && (
          <IconButton
            icon="bi-arrow-clockwise"
            label="Reconectar conversa"
            onClick={thread.retry}
          />
        )}
      </div>
      {connectionNotice && (
        <div
          role="status"
          className="small px-3 py-2 bg-warning-subtle text-warning-emphasis border-top"
        >
          {connectionNotice}
        </div>
      )}
    </header>
  );
}
