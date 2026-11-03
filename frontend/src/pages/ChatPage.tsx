import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { EmptyState, ErrorState, PageHeading } from "../components/Feedback";
import { ConversationDetailsModal } from "../features/chat/components/ConversationDetailsModal";
import { ConversationHeader } from "../features/chat/components/ConversationHeader";
import { ConversationList } from "../features/chat/components/ConversationList";
import { MessageComposer } from "../features/chat/components/MessageComposer";
import { MessageList } from "../features/chat/components/MessageList";
import type { Conversation } from "../features/chat/conversations";
import { useChatConversations } from "../features/chat/hooks/useChatConversations";
import { useChatThread } from "../features/chat/hooks/useChatThread";

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
  const selected = useMemo(() => conversations.find((item) => item.kind === routeKind && item.id === routeId), [conversations, routeId, routeKind]);
  const thread = useChatThread({ conversation: selected, token, userId, displayName: profile?.name ?? profile?.username ?? "Atleta" });

  return <div className={`chat-page${selected ? " is-thread" : " is-inbox"}`}>
    <PageHeading eyebrow="CONEXÃO EM TEMPO REAL" title="Conversas" description="Converse com suas amizades, equipes e participantes de agendamentos." />
    {conversationsQuery.error && <div className="chat-page-error"><ErrorState message={conversationsQuery.error instanceof Error ? conversationsQuery.error.message : "Não foi possível carregar as conversas. Tente novamente."} /></div>}
    <div className={`chat-layout${selected ? " has-selection" : ""}`}>
      <ConversationList conversations={conversations} selected={selected} loading={conversationsQuery.isPending} onRefresh={() => void conversationsQuery.refetch()} onOpen={(item) => navigate(`/chat/${item.kind}/${item.id}`)} />
      <section className="chat-thread">{!selected ? <div className="chat-empty-thread"><EmptyState icon="bi-chat-dots" title="Escolha uma conversa" description="As conversas privadas disponíveis para sua conta aparecem nesta lista." /></div> : <>
        <ConversationHeader conversation={selected} thread={thread} userId={userId} onBack={() => navigate("/chat")} onDetails={() => setShowDetails(true)} />
        <MessageList messages={thread.messages} userId={userId} connection={thread.connection} chatError={thread.chatError} hasOlderMessages={thread.hasOlderMessages} loadingHistory={thread.loadingHistory} onLoadOlder={() => void thread.loadOlderMessages()} listRef={thread.messageListRef} endRef={thread.messagesEndRef} />
        <MessageComposer text={thread.text} onTextChange={thread.setText} onSubmit={(event) => void thread.sendMessage(event)} sending={thread.sending} connected={thread.connection === "connected"} />
      </>}</section>
    </div>
    <ConversationDetailsModal conversation={selected} show={showDetails} onHide={() => setShowDetails(false)} />
  </div>;
}
