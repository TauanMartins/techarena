import Button from "react-bootstrap/Button";
import { ErrorState, LoadingState } from "../../../components/Feedback";
import type { ChatMessage } from "../message-mapper";

export function MessageList({ messages, userId, connection, chatError, hasOlderMessages, loadingHistory, onLoadOlder, listRef, endRef }: {
  messages: ChatMessage[]; userId: string; connection: string; chatError: string | null;
  hasOlderMessages: boolean; loadingHistory: boolean; onLoadOlder: () => void;
  listRef: React.RefObject<HTMLDivElement | null>; endRef: React.RefObject<HTMLDivElement | null>;
}) {
  return <>
    <div className="message-list" aria-live="polite" ref={listRef}>
      {hasOlderMessages && <Button variant="outline-secondary" size="sm" className="align-self-center" disabled={loadingHistory} onClick={onLoadOlder}>{loadingHistory ? "Carregando..." : "Carregar mensagens anteriores"}</Button>}
      {connection === "connecting" && !messages.length && <LoadingState label="Conectando e carregando o histórico..." />}
      {connection === "error" && !messages.length && <div className="message-empty">Não foi possível abrir esta conversa.</div>}
      {connection === "connected" && !messages.length && <div className="message-empty">Nenhuma mensagem ainda. Envie a primeira para iniciar a conversa.</div>}
      {messages.map((message) => { const own = message.userId === userId; return <div className={`message-row${own ? " own" : ""}`} key={message.id}>
        {!own && <span className="message-author">{message.name}</span>}<div className="message-bubble"><span>{message.text}</span><time>{new Date(message.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time></div>
      </div>; })}<div ref={endRef} />
    </div>
    {chatError && <div className="chat-error"><ErrorState message={chatError} /></div>}
  </>;
}
