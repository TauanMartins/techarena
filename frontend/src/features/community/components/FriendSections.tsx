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
  busy,
}: {
  incoming: Friend[];
  friends: Friend[];
  onDetails: (person: UserCard) => void;
  onAccept: (friendId: string) => void;
  onBlock: (friendId: string) => void;
  onChat: (person: UserCard) => void;
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
                  Aceitar
                </Button>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => onBlock(friend.id)}
                  disabled={busy}
                >
                  Bloquear
                </Button>
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
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => onDetails(friend.user)}
                >
                  Detalhes
                </Button>
                <Button
                  size="sm"
                  onClick={() => onChat(friend.user)}
                >
                  Conversar
                </Button>
              </PersonListItem>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
