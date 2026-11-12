import { Avatar } from '../../../components/ui/Avatar';
import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';
import type { Conversation } from '../types/conversation.types';

export function ConversationAvatar({
  conversation,
  className = '',
}: {
  conversation: Conversation;
  className?: string;
}) {
  if (conversation.kind === 'direct')
    return (
      <ProfileAvatar
        name={conversation.label}
        image={conversation.image ?? null}
        className={className}
      />
    );
  return (
    <Avatar
      image={conversation.image ?? null}
      icon={conversation.kind === 'team' ? 'team' : 'appointment'}
      className={className}
      label={
        conversation.image
          ? `Imagem de ${conversation.label}`
          : `${conversation.kind === 'team' ? 'Equipe' : 'Agendamento'} ${conversation.label}`
      }
    />
  );
}
