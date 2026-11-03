import Button from "react-bootstrap/Button";
import type { Friend, UserCard } from "../types/community.types";
import { ProfileAvatar } from "../../../components/ProfileAvatar";

export function FriendSections({ incoming, friends, onDetails, onAccept, onBlock, onChat, busy }: {
  incoming: Friend[]; friends: Friend[]; onDetails: (person: UserCard) => void;
  onAccept: (friendId: string) => void; onBlock: (friendId: string) => void;
  onChat: (person: UserCard) => void; busy: boolean;
}) {
  return <>
    <section className="content-section"><div className="section-title-row"><div><span className="eyebrow">AGUARDANDO RESPOSTA</span><h2>Solicitações recebidas</h2></div><span className="count-pill">{incoming.length}</span></div>
      {!incoming.length ? <div className="content-card p-3">Nenhuma solicitação pendente por enquanto.</div> : <div className="people-list content-card">{incoming.map((friend) => <div className="person-row" key={friend.id}>
        <ProfileAvatar name={friend.user.name} image={friend.user.image} /><button className="person-info person-detail-trigger" type="button" onClick={() => onDetails(friend.user)}><strong>{friend.user.name ?? "Atleta"}</strong><span>{friend.user.username ? `@${friend.user.username}` : "Solicitação de amizade"}</span></button>
        <div className="d-flex gap-2"><Button size="sm" onClick={() => onAccept(friend.id)} disabled={busy}>Aceitar</Button><Button size="sm" variant="outline-secondary" onClick={() => onBlock(friend.id)} disabled={busy}>Bloquear</Button></div>
      </div>)}</div>}
    </section>
    <section className="content-section"><div className="section-title-row"><div><span className="eyebrow">SUA REDE</span><h2>Amizades</h2></div><span className="count-pill">{friends.length}</span></div>
      {!friends.length ? <div className="content-card p-3">Sua rede está começando. Adicione atletas para combinar partidas e conversar.</div> : <div className="people-list content-card">{friends.map((friend) => <div className="person-row" key={friend.id}>
        <ProfileAvatar name={friend.user.name} image={friend.user.image} /><button className="person-info person-detail-trigger" type="button" onClick={() => onDetails(friend.user)}><strong>{friend.user.name ?? "Atleta"}</strong><span>{friend.user.username ? `@${friend.user.username}` : "Amizade aceita"}</span></button>
        <div className="d-flex gap-2"><Button size="sm" variant="outline-secondary" onClick={() => onDetails(friend.user)}>Detalhes</Button><Button size="sm" onClick={() => onChat(friend.user)}>Conversar</Button></div>
      </div>)}</div>}
    </section>
  </>;
}
