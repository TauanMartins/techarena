import { ActionMenu } from '../../../components/ui/ActionMenu';
import { IconButton } from '../../../components/ui/IconButton';
import { SectionHeading } from '../../../components/ui/SectionHeading';
import Button from 'react-bootstrap/Button';
import type { Friend, UserCard } from '../types/community.types';
import { PersonListItem } from '../../../components/ui/PersonListItem';

export function FriendSections({
  incoming,
  friends,
  onDetails,
  onAccept,
  onBlock,
  onChat,
  onRemove,
  busy,
}: {
  incoming: Friend[];
  friends: Friend[];
  onDetails: (person: UserCard) => void;
  onAccept: (friendId: string) => void;
  onBlock: (friendId: string) => void;
  onChat: (person: UserCard) => void;
  onRemove?: (id: string) => void;
  busy: boolean;
}) {
  return (
    <>
      <section className="my-4">
        <SectionHeading
          eyebrow="AGUARDANDO RESPOSTA"
          title="Solicitações recebidas"
          action={
            <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis">
              {incoming.length}
            </span>
          }
        />
        {!incoming.length ? (
          <div className="border rounded-4 shadow-sm bg-body p-3">
            Nenhuma solicitação pendente por enquanto.
          </div>
        ) : (
          <div className="list-group rounded-3 border rounded-4 shadow-sm bg-body">
            {incoming.map((friend) => (
              <PersonListItem
                key={friend.id}
                name={friend.user.name}
                image={friend.user.image}
                description={
                  friend.user.username
                    ? `@${friend.user.username}`
                    : 'Solicitação de amizade'
                }
                onDetails={() => onDetails(friend.user)}
              >
                <Button
                  size="sm"
                  onClick={() => onAccept(friend.id)}
                  disabled={busy}
                >
                  <i
                    className="bi bi-check-lg me-1"
                    aria-hidden="true"
                  />
                  Aceitar
                </Button>
                <ActionMenu
                  label={`Ações para ${friend.user.name}`}
                  disabled={busy}
                  actions={[
                    {
                      label: 'Bloquear',
                      icon: 'bi-person-slash',
                      danger: true,
                      onClick: () => onBlock(friend.id),
                    },
                  ]}
                />
              </PersonListItem>
            ))}
          </div>
        )}
      </section>
      <section className="my-4">
        <SectionHeading
          eyebrow="SUA REDE"
          title="Amizades"
          action={
            <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis">
              {friends.length}
            </span>
          }
        />
        {!friends.length ? (
          <div className="border rounded-4 shadow-sm bg-body p-3">
            Sua rede está começando. Adicione atletas para combinar partidas e
            conversar.
          </div>
        ) : (
          <div className="list-group rounded-3 border rounded-4 shadow-sm bg-body">
            {friends.map((friend) => (
              <PersonListItem
                key={friend.id}
                name={friend.user.name}
                image={friend.user.image}
                description={
                  friend.user.username
                    ? `@${friend.user.username}`
                    : 'Amizade aceita'
                }
                onDetails={() => onDetails(friend.user)}
              >
                <IconButton
                  icon="bi-chat-dots"
                  label={`Conversar com ${friend.user.name}`}
                  onClick={() => onChat(friend.user)}
                />
                <ActionMenu
                  label={`Ações para ${friend.user.name}`}
                  disabled={busy}
                  actions={[
                    ...(onRemove
                      ? [
                          {
                            label: 'Desfazer amizade',
                            icon: 'bi-person-dash',
                            danger: true,
                            onClick: () => onRemove(friend.id),
                          },
                        ]
                      : []),
                    {
                      label: 'Bloquear',
                      icon: 'bi-person-slash',
                      danger: true,
                      onClick: () => onBlock(friend.id),
                    },
                  ]}
                />
              </PersonListItem>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
