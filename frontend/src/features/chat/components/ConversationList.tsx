import Button from "react-bootstrap/Button";
import { LoadingState } from "../../../components/ui/Feedback";
import type { Conversation } from "../types/conversation.types";
import { ConversationAvatar } from "./ConversationAvatar";

export function ConversationList({ conversations, selected, loading, onRefresh, onOpen }: {
  conversations: Conversation[]; selected?: Conversation; loading: boolean;
  onRefresh: () => void; onOpen: (conversation: Conversation) => void;
}) {
  return <aside className="chat-list-panel">
    <div className="chat-list-heading"><div><strong>Conversas</strong>{!loading && <small>{conversations.length} {conversations.length === 1 ? "conversa" : "conversas"}</small>}</div>
      <Button size="sm" variant="light" onClick={onRefresh} aria-label="Atualizar conversas"><i className="bi bi-arrow-clockwise" /></Button>
    </div>
    {loading && <LoadingState label="Carregando..." />}
    {!loading && !conversations.length && <div className="chat-list-empty">Adicione amizades, entre em equipes ou participe de partidas para iniciar uma conversa.</div>}
    {conversations.map((conversation) => <button type="button" key={`${conversation.kind}-${conversation.id}`} className={`chat-list-item${selected?.kind === conversation.kind && selected.id === conversation.id ? " active" : ""}`} onClick={() => onOpen(conversation)}>
      <ConversationAvatar conversation={conversation} /><span className="chat-list-copy"><strong>{conversation.label}</strong><small>{conversation.detail}</small></span>
    </button>)}
  </aside>;
}
