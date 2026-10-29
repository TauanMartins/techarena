import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Image from "react-bootstrap/Image";
import Modal from "react-bootstrap/Modal";
import { useAuth } from "../auth/useAuth";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeading,
} from "../components/Feedback";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { type Conversation } from "../features/chat/conversations";
import { useChatConversations } from "../features/chat/useChatConversations";
import { useChatThread } from "../features/chat/useChatThread";
const EMPTY_CONVERSATIONS: Conversation[] = [];

export function ChatPage() {
  const { session, profile } = useAuth();
  const token = session!.access_token;
  const userId = session!.user.id;
  const { kind: routeKind, id: routeId } = useParams();
  const navigate = useNavigate();
  const conversationsQuery = useChatConversations(token, userId);
  const conversations = conversationsQuery.data ?? EMPTY_CONVERSATIONS;
  const loadingList = conversationsQuery.isPending;
  const [showDetails, setShowDetails] = useState(false);

  const selected = useMemo(
    () =>
      conversations.find(
        (conversation) =>
          conversation.kind === routeKind && conversation.id === routeId,
      ),
    [conversations, routeId, routeKind],
  );
  const thread = useChatThread({
    conversation: selected,
    token,
    userId,
    displayName: profile?.name ?? profile?.username ?? "Atleta",
  });
  const {
    messages,
    loadingHistory,
    hasOlderMessages,
    connection,
    chatError,
    onlineUserIds,
    presenceSynced,
    text,
    setText,
    sending,
    retry,
    loadOlderMessages,
    sendMessage,
    messagesEndRef,
    messageListRef,
  } = thread;

  const openConversation = (conversation: Conversation) => {
    navigate(`/chat/${conversation.kind}/${conversation.id}`);
  };
  const otherParticipantOnline = Boolean(
    selected?.otherUserId &&
    selected.otherUserId.toLowerCase() !== userId.toLowerCase() &&
    onlineUserIds.includes(selected.otherUserId),
  );

  return (
    <div className={`chat-page${selected ? " is-thread" : " is-inbox"}`}>
      <PageHeading
        eyebrow="CONEXÃO EM TEMPO REAL"
        title="Conversas"
        description="Converse com suas amizades, equipes e participantes de agendamentos."
      />
      {conversationsQuery.error && (
        <div className="chat-page-error">
          <ErrorState
            message={
              conversationsQuery.error instanceof Error
                ? conversationsQuery.error.message
                : "Não foi possível carregar as conversas. Tente novamente."
            }
          />
        </div>
      )}
      <div className={`chat-layout${selected ? " has-selection" : ""}`}>
        <aside className="chat-list-panel">
          <div className="chat-list-heading">
            <div>
              <strong>Conversas</strong>
              {!loadingList && (
                <small>
                  {conversations.length}{" "}
                  {conversations.length === 1 ? "conversa" : "conversas"}
                </small>
              )}
            </div>
            <Button
              size="sm"
              variant="light"
              onClick={() => void conversationsQuery.refetch()}
              aria-label="Atualizar conversas"
            >
              <i className="bi bi-arrow-clockwise" />
            </Button>
          </div>
          {loadingList && <LoadingState label="Carregando..." />}
          {!loadingList && !conversations.length && (
            <div className="chat-list-empty">
              Adicione amizades, entre em equipes ou participe de partidas para
              iniciar uma conversa.
            </div>
          )}
          {conversations.map((conversation) => (
            <button
              type="button"
              key={`${conversation.kind}-${conversation.id}`}
              className={`chat-list-item${selected?.kind === conversation.kind && selected.id === conversation.id ? " active" : ""}`}
              onClick={() => openConversation(conversation)}
            >
              {conversation.kind === "direct" ? (
                <ProfileAvatar
                  name={conversation.label}
                  image={conversation.image ?? null}
                  className="chat-avatar"
                />
              ) : conversation.image ? (
                <Image
                  className="chat-avatar"
                  src={conversation.image}
                  alt={`Imagem de ${conversation.label}`}
                  roundedCircle
                />
              ) : (
                <span className="chat-avatar">
                  <i
                    className={`bi ${conversation.kind === "team" ? "bi-people-fill" : "bi-calendar2-event"}`}
                  />
                </span>
              )}
              <span className="chat-list-copy">
                <strong>{conversation.label}</strong>
                <small>{conversation.detail}</small>
              </span>
            </button>
          ))}
        </aside>
        <section className="chat-thread">
          {!selected ? (
            <div className="chat-empty-thread">
              <EmptyState
                icon="bi-chat-dots"
                title="Escolha uma conversa"
                description="As conversas privadas disponíveis para sua conta aparecem nesta lista."
              />
            </div>
          ) : (
            <>
              <header className="chat-thread-header">
                <Button
                  size="sm"
                  variant="light"
                  className="chat-back-button"
                  onClick={() => navigate("/chat")}
                  aria-label="Voltar para conversas"
                >
                  <i className="bi bi-arrow-left" aria-hidden="true" />
                </Button>
                {selected.kind === "direct" ? (
                  <ProfileAvatar
                    name={selected.label}
                    image={selected.image ?? null}
                    className="chat-avatar"
                  />
                ) : selected.image ? (
                  <Image
                    className="chat-avatar"
                    src={selected.image}
                    alt={`Imagem de ${selected.label}`}
                    roundedCircle
                  />
                ) : (
                  <span className="chat-avatar">
                    <i
                      className={`bi ${selected.kind === "team" ? "bi-people-fill" : "bi-calendar2-event"}`}
                    />
                  </span>
                )}
                <div>
                  <strong>{selected.label}</strong>
                  <small>
                    {selected.kind === "direct"
                      ? !presenceSynced
                        ? "Verificando presença..."
                        : otherParticipantOnline
                          ? "Pessoa online agora"
                          : "Pessoa offline"
                      : !presenceSynced
                        ? "Verificando presença..."
                        : `${Math.max(0, onlineUserIds.filter((id) => id !== userId).length)} outras pessoas online`}
                  </small>
                </div>
                <span className={`realtime-status ${connection}`}>
                  <i className="bi bi-circle-fill" />
                  {connection === "connected"
                    ? "Sua conexão: conectada"
                    : connection === "connecting"
                      ? "Sua conexão: conectando..."
                      : connection === "error"
                        ? "Sua conexão: indisponível"
                        : "Sua conexão: desconectada"}
                </span>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => setShowDetails(true)}
                  aria-label="Detalhes da conversa"
                >
                  <i className="bi bi-info-circle" aria-hidden="true" />
                  <span className="chat-details-label">Detalhes</span>
                </Button>
                {connection === "error" && (
                  <Button
                    size="sm"
                    variant="light"
                    onClick={retry}
                    aria-label="Reconectar conversa"
                  >
                    <i className="bi bi-arrow-clockwise" />
                  </Button>
                )}
              </header>
              <div
                className="message-list"
                aria-live="polite"
                ref={messageListRef}
              >
                {hasOlderMessages && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="align-self-center"
                    disabled={loadingHistory}
                    onClick={() => void loadOlderMessages()}
                  >
                    {loadingHistory
                      ? "Carregando..."
                      : "Carregar mensagens anteriores"}
                  </Button>
                )}
                {connection === "connecting" && messages.length === 0 && (
                  <LoadingState label="Conectando e carregando o histórico..." />
                )}
                {connection === "error" && messages.length === 0 && (
                  <div className="message-empty">
                    Não foi possível abrir esta conversa.
                  </div>
                )}
                {connection === "connected" && messages.length === 0 && (
                  <div className="message-empty">
                    Nenhuma mensagem ainda. Envie a primeira para iniciar a
                    conversa.
                  </div>
                )}
                {messages.map((message) => {
                  const own = message.userId === userId;
                  return (
                    <div
                      className={`message-row${own ? " own" : ""}`}
                      key={message.id}
                    >
                      {!own && (
                        <span className="message-author">{message.name}</span>
                      )}
                      <div className="message-bubble">
                        <span>{message.text}</span>
                        <time>
                          {new Date(message.createdAt).toLocaleTimeString(
                            "pt-BR",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </time>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              {chatError && (
                <div className="chat-error">
                  <ErrorState message={chatError} />
                </div>
              )}
              <Form
                onSubmit={(event) => void sendMessage(event)}
                className="chat-compose"
              >
                <Form.Control
                  aria-label="Mensagem"
                  placeholder="Escreva uma mensagem..."
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  maxLength={1000}
                  disabled={connection !== "connected"}
                />
                <Button
                  type="submit"
                  disabled={
                    !text.trim() || sending || connection !== "connected"
                  }
                  aria-label="Enviar mensagem"
                  title="Enviar mensagem"
                >
                  <i className="bi bi-send-fill" />
                </Button>
              </Form>
            </>
          )}
        </section>
      </div>
      <Modal
        show={showDetails && selected !== undefined}
        onHide={() => setShowDetails(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Detalhes da conversa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected && (
            <div className="conversation-details">
              <span className="eyebrow">
                {selected.kind === "direct"
                  ? "CONVERSA PRIVADA"
                  : selected.kind === "team"
                    ? "CONVERSA DE EQUIPE"
                    : "CONVERSA DO AGENDAMENTO"}
              </span>
              {selected.image && selected.kind !== "direct" && (
                <Image
                  className="conversation-detail-image"
                  src={selected.image}
                  alt={`Imagem de ${selected.label}`}
                  rounded
                />
              )}
              {selected.kind === "direct" && (
                <ProfileAvatar
                  name={selected.label}
                  image={selected.image ?? null}
                  className="profile-detail-avatar"
                />
              )}
              <h3>{selected.label}</h3>
              {selected.kind === "direct" && (
                <p>
                  {selected.username
                    ? `@${selected.username}`
                    : "Atleta da sua rede"}
                </p>
              )}
              {selected.kind === "team" && (
                <>
                  <p>
                    {selected.description ||
                      "Esta equipe ainda não tem uma descrição."}
                  </p>
                  {selected.role && <p>Seu papel: {selected.role}</p>}
                </>
              )}
              {selected.kind === "appointment" && (
                <>
                  <p>
                    {selected.description ||
                      "Sem descrição adicional para este agendamento."}
                  </p>
                  {selected.scheduledAt && (
                    <p>
                      <strong>Data:</strong>{" "}
                      {new Date(selected.scheduledAt).toLocaleString("pt-BR", {
                        dateStyle: "long",
                        timeStyle: "short",
                      })}
                    </p>
                  )}
                  {selected.status && (
                    <p>
                      <strong>Situação:</strong>{" "}
                      {selected.status === "scheduled"
                        ? "Confirmado"
                        : selected.status === "in_progress"
                          ? "Em andamento"
                          : selected.status === "finished"
                            ? "Finalizado"
                            : "Cancelado"}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
