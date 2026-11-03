import Image from "react-bootstrap/Image";
import { ProfileAvatar } from "../../../components/ui/ProfileAvatar";
import type { Conversation } from "../types/conversation.types";

export function ConversationAvatar({ conversation, className = "chat-avatar" }: { conversation: Conversation; className?: string }) {
  if (conversation.kind === "direct") return <ProfileAvatar name={conversation.label} image={conversation.image ?? null} className={className} />;
  if (conversation.image) return <Image className={className} src={conversation.image} alt={`Imagem de ${conversation.label}`} roundedCircle />;
  return <span className={className} role="img" aria-label={`${conversation.kind === "team" ? "Equipe" : "Agendamento"} ${conversation.label}`}><i className={`bi ${conversation.kind === "team" ? "bi-people-fill" : "bi-calendar2-event"}`} aria-hidden="true" /></span>;
}
