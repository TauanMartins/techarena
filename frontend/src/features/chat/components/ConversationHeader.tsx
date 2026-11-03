import Button from "react-bootstrap/Button";
import type { Conversation } from "../types/conversation.types";
import type { useChatThread } from "../hooks/useChatThread";
import { ConversationAvatar } from "./ConversationAvatar";

type Thread = ReturnType<typeof useChatThread>;
export function ConversationHeader({ conversation, thread, userId, onBack, onDetails }: { conversation: Conversation; thread: Thread; userId: string; onBack: () => void; onDetails: () => void }) {
  const otherOnline = Boolean(conversation.otherUserId && conversation.otherUserId.toLowerCase() !== userId.toLowerCase() && thread.onlineUserIds.includes(conversation.otherUserId));
  const presence = !thread.presenceSynced ? "Verificando presença..." : conversation.kind === "direct" ? otherOnline ? "Pessoa online agora" : "Pessoa offline" : `${Math.max(0, thread.onlineUserIds.filter((id) => id !== userId).length)} outras pessoas online`;
  const connection = thread.connection === "connected" ? "Sua conexão: conectada" : thread.connection === "connecting" ? "Sua conexão: conectando..." : thread.connection === "error" ? "Sua conexão: indisponível" : "Sua conexão: desconectada";
  return <header className="chat-thread-header">
    <Button size="sm" variant="light" className="chat-back-button" onClick={onBack} aria-label="Voltar para conversas"><i className="bi bi-arrow-left" aria-hidden="true" /></Button>
    <ConversationAvatar conversation={conversation} /><div><strong>{conversation.label}</strong><small>{presence}</small></div>
    <span className={`realtime-status ${thread.connection}`}><i className="bi bi-circle-fill" />{connection}</span>
    <Button size="sm" variant="outline-secondary" onClick={onDetails} aria-label="Detalhes da conversa"><i className="bi bi-info-circle" aria-hidden="true" /><span className="chat-details-label">Detalhes</span></Button>
    {thread.connection === "error" && <Button size="sm" variant="light" onClick={thread.retry} aria-label="Reconectar conversa"><i className="bi bi-arrow-clockwise" /></Button>}
  </header>;
}
