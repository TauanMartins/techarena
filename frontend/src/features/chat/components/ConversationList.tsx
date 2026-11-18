import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import { useCurrentTimestamp } from '../../../shared/clock';
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
  const [showAll, setShowAll] = useState(false);
  const [kind, setKind] = useState('all');
  const now = useCurrentTimestamp();
  const visible = conversations.filter(
    (item) =>
      (kind === 'all' || item.kind === kind) &&
      (item.kind !== 'appointment' ||
        showAll ||
        ((!item.status || item.status === 'scheduled') &&
          (!item.scheduledAt || new Date(item.scheduledAt).getTime() > now))),
  );
  return (
    <aside className="bg-body">
      <div className="d-flex align-items-center justify-content-between gap-2 p-3 border-bottom sticky-top bg-body">
        <div className="d-flex flex-column">
          <strong>Conversas</strong>
          {!loading && (
            <small className="text-body-secondary">
              {visible.length} {visible.length === 1 ? 'conversa' : 'conversas'}
            </small>
          )}
        </div>
        <IconButton
          icon="bi-arrow-clockwise"
          label="Atualizar conversas"
          onClick={onRefresh}
        />
      </div>
      <div className="d-flex align-items-center gap-1 p-2 border-bottom">
        <div
          className="d-flex flex-wrap gap-1 flex-grow-1"
          role="group"
          aria-label="Filtrar conversas"
        >
          {[
            ['all', 'Todas'],
            ['direct', 'Pessoas'],
            ['team', 'Equipes'],
            ['appointment', 'Agendamentos'],
          ].map(([value, label]) => (
            <Button
              key={value}
              type="button"
              className={`btn btn-sm rounded-pill ${kind === value ? 'btn-primary' : 'btn-outline-secondary'}`}
              aria-pressed={kind === value}
              onClick={() => setKind(value)}
            >
              {label}
            </Button>
          ))}
        </div>
        {(kind === 'all' || kind === 'appointment') && (
          <IconButton
            icon="bi-clock-history"
            label="Incluir encerrados"
            aria-pressed={showAll}
            variant={showAll ? 'primary' : 'outline-secondary'}
            onClick={() => setShowAll(!showAll)}
          />
        )}
      </div>
      {loading && <LoadingState label="Carregando..." />}
      {!loading && !visible.length && (
        <div className="p-3 small text-body-secondary">
          Adicione amizades, entre em equipes ou participe de partidas para
          iniciar uma conversa.
        </div>
      )}
      <ListGroup variant="flush">
        {visible.map((conversation) => (
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
