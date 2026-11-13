import ListGroup from 'react-bootstrap/ListGroup';
import { IconButton } from '../../../components/ui/IconButton';
import { LoadingState } from '../../../components/ui/Feedback';
import type { Conversation } from '../types/conversation.types';
import { ConversationAvatar } from './ConversationAvatar';

export function ConversationList({
  conversations,
  selected,
  loading,
  onRefresh,
  onOpen,
}: {
  conversations: Conversation[];
  selected?: Conversation;
  loading: boolean;
  onRefresh: () => void;
  onOpen: (conversation: Conversation) => void;
}) {
  return (
    <aside className="bg-body">
      <div className="d-flex align-items-center justify-content-between gap-2 p-3 border-bottom sticky-top bg-body">
        <div className="d-flex flex-column">
          <strong>Conversas</strong>
          {!loading && (
            <small className="text-body-secondary">
              {conversations.length}{' '}
              {conversations.length === 1 ? 'conversa' : 'conversas'}
            </small>
          )}
        </div>
        <IconButton
          icon="bi-arrow-clockwise"
          label="Atualizar conversas"
          onClick={onRefresh}
        />
      </div>
      {loading && <LoadingState label="Carregando..." />}
      {!loading && !conversations.length && (
        <div className="p-3 small text-body-secondary">
          Adicione amizades, entre em equipes ou participe de partidas para
          iniciar uma conversa.
        </div>
      )}
      <ListGroup variant="flush">
        {conversations.map((conversation) => (
          <ListGroup.Item
            action
            type="button"
            key={`${conversation.kind}-${conversation.id}`}
            active={
              selected?.kind === conversation.kind &&
              selected.id === conversation.id
            }
            className="d-flex align-items-center gap-3 p-3"
            onClick={() => onOpen(conversation)}
          >
            <ConversationAvatar conversation={conversation} />
            <span className="d-flex flex-column overflow-hidden text-start">
              <strong className="text-truncate">{conversation.label}</strong>
              <small>{conversation.detail}</small>
            </span>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </aside>
  );
}
