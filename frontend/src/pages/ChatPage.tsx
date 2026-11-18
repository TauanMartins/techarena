import { TypingIndicator } from '../features/chat/components/TypingIndicator';
import styles from '../features/chat/styles/Chat.module.scss';
import { useChatViewport } from '../features/chat/hooks/useChatViewport';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { EmptyState, ErrorState, PageHeading } from '../components/ui/Feedback';
import { ConversationDetailsModal } from '../features/chat/components/ConversationDetailsModal';
import { ConversationHeader } from '../features/chat/components/ConversationHeader';
import { ConversationList } from '../features/chat/components/ConversationList';
import { MessageComposer } from '../features/chat/components/MessageComposer';
import { MessageList } from '../features/chat/components/MessageList';
import type { Conversation } from '../features/chat/types/conversation.types';
import { useChatConversations } from '../features/chat/hooks/useChatConversations';
import { useChatThread } from '../features/chat/hooks/useChatThread';

const EMPTY_CONVERSATIONS: Conversation[] = [];

export function ChatPage() {
  const { session, profile } = useAuth();
  const { kind: routeKind, id: routeId } = useParams();
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const token = session!.access_token;
  const userId = session!.user.id;
  const conversationsQuery = useChatConversations(token, userId);
  const conversations = conversationsQuery.data ?? EMPTY_CONVERSATIONS;
  const selected = useMemo(
    () =>
      conversations.find(
        (item) => item.kind === routeKind && item.id === routeId,
      ),
    [conversations, routeId, routeKind],
  );
  const thread = useChatThread({
    conversation: selected,
    token,
    userId,
    image: profile?.image,
    displayName: profile?.name ?? profile?.username ?? 'Atleta',
  });

  const viewportRef = useChatViewport(Boolean(routeId));
  return (
    <div
      ref={viewportRef}
      className={`d-flex flex-column h-100 overflow-hidden ${styles.thread} ${routeId ? styles.fullscreen : ''}`}
    >
      <div
        className={
          selected ? 'd-none d-md-block flex-shrink-0' : 'flex-shrink-0'
        }
      >
        <PageHeading
          eyebrow="CONEXÃO EM TEMPO REAL"
          title="Conversas"
          description="Converse com suas amizades, equipes e participantes de agendamentos."
        />
      </div>
      {conversationsQuery.error && (
        <div className="mb-3">
          <ErrorState
            message={
              conversationsQuery.error instanceof Error
                ? conversationsQuery.error.message
                : 'Não foi possível carregar as conversas. Tente novamente.'
            }
          />
        </div>
      )}
      <Row className="g-0 border rounded-4 bg-body shadow-sm flex-grow-1 min-h-0 overflow-hidden flex-nowrap">
        <Col
          xs={12}
          md={4}
          className={`border-end overflow-auto ${selected ? 'd-none d-md-block' : ''}`}
        >
          <ConversationList
            conversations={conversations}
            selected={selected}
            loading={conversationsQuery.isPending}
            onRefresh={() => void conversationsQuery.refetch()}
            onOpen={(item) => navigate(`/chat/${item.kind}/${item.id}`)}
          />
        </Col>
        <Col
          as="section"
          xs={12}
          md={8}
          className={`flex-column overflow-hidden ${selected ? 'd-flex' : 'd-none d-md-flex'}`}
        >
          {!selected ? (
            <div className="d-flex flex-grow-1 align-items-center justify-content-center p-3">
              <EmptyState
                icon="bi-chat-dots"
                title="Escolha uma conversa"
                description="As conversas privadas disponíveis para sua conta aparecem nesta lista."
              />
            </div>
          ) : (
            <>
              <ConversationHeader
                conversation={selected}
                thread={thread}
                userId={userId}
                onBack={() => navigate('/chat')}
                onDetails={() => setShowDetails(true)}
              />
              <MessageList
                messages={thread.messages}
                userId={userId}
                connection={thread.connection}
                chatError={thread.chatError}
                hasOlderMessages={thread.hasOlderMessages}
                loadingHistory={thread.loadingHistory}
                onLoadOlder={() => void thread.loadOlderMessages()}
                listRef={thread.messageListRef}
                endRef={thread.messagesEndRef}
              />
              <TypingIndicator people={thread.typingPeople ?? []} />
              <MessageComposer
                onBlur={thread.stopTyping}
                text={thread.text}
                onTextChange={thread.setText}
                onSubmit={(event) => void thread.sendMessage(event)}
                sending={thread.sending}
                connected={thread.connection === 'connected'}
              />
            </>
          )}
        </Col>
      </Row>
      <ConversationDetailsModal
        token={token}
        conversation={selected}
        show={showDetails}
        onHide={() => setShowDetails(false)}
      />
    </div>
  );
}
