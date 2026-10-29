import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Image from 'react-bootstrap/Image';
import Modal from 'react-bootstrap/Modal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { EmptyState, ErrorState, LoadingState, PageHeading } from '../components/Feedback';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { api } from '../shared/api';
import type { FriendGroups, UserCard } from '../shared/types';

export function CommunityPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const token = session!.access_token;
  const [groups, setGroups] = useState<FriendGroups | null>(null);
  const [people, setPeople] = useState<UserCard[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyFriendId, setBusyFriendId] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<UserCard | null>(null);

  const loadCommunity = useCallback(async (term: string) => {
    setLoading(true);
    setError(null);
    try {
      const friendGroups = await api.listFriends(token);
      setGroups(friendGroups);
      if (term.trim().length >= 2) {
        const directory = await api.searchUsers(token, term.trim());
        setPeople(directory.items.filter((person) => person.id !== session?.user.id));
      } else {
        setPeople([]);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a comunidade.');
    } finally {
      setLoading(false);
    }
  }, [session?.user.id, token]);

  useEffect(() => { void loadCommunity(''); }, [loadCommunity]);

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (search.trim().length < 2) {
      setError('Digite pelo menos 2 caracteres para buscar atletas.');
      return;
    }
    await loadCommunity(search);
  }

  async function friendAction(friendId: string, action: 'accept' | 'block') {
    setBusyFriendId(friendId);
    setError(null);
    setNotice(null);
    try {
      await api.decideFriend(token, friendId, action);
      setNotice(action === 'accept' ? 'Solicitação aceita. Vocês já podem conversar.' : 'Atleta bloqueado.');
      await loadCommunity(search);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar a solicitação.');
    } finally {
      setBusyFriendId(null);
    }
  }

  async function requestFriend(userId: string) {
    setBusyFriendId(userId);
    setError(null);
    setNotice(null);
    try {
      await api.requestFriend(token, userId);
      setNotice('Solicitação de amizade enviada.');
      await loadCommunity(search);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível enviar a solicitação.');
    } finally {
      setBusyFriendId(null);
    }
  }

  const friendIds = new Set(groups?.friends.items.map((friend) => friend.user.id) ?? []);
  const outgoingIds = new Set(groups?.requestedFriends.items.map((friend) => friend.user.id) ?? []);
  const incoming = groups?.receivedFriends.items ?? [];

  return (
    <>
      <PageHeading eyebrow="CONEXÕES" title="Comunidade" description="Encontre atletas, construa amizades e combine o próximo jogo." />
      {notice && <div className="inline-notice" role="status"><i className="bi bi-check-circle-fill" />{notice}</div>}
      {error && <ErrorState message={error} />}
      <Card className="content-card mb-4">
        <Card.Body>
          <div className="section-title-row"><div><span className="eyebrow">NOVAS CONEXÕES</span><h2>Encontrar atletas</h2></div></div>
          <Form className="search-bar mb-3" onSubmit={(event) => void submitSearch(event)}>
            <i className="bi bi-search" aria-hidden="true" />
            <Form.Control aria-label="Buscar atletas" placeholder="Buscar por nome ou usuário" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Button type="submit" variant="outline-primary">Buscar</Button>
          </Form>
          {loading && <LoadingState label="Buscando atletas..." />}
          {!loading && !people.length && <EmptyState icon="bi-person-search" title={search.trim().length >= 2 ? 'Nenhum atleta encontrado' : 'Busque atletas da comunidade'} description={search.trim().length >= 2 ? 'Experimente buscar por outro nome ou usuário.' : 'Digite pelo menos 2 caracteres para encontrar pessoas.'} />}
          {!loading && people.length > 0 && (
            <div className="people-list">
              {people.map((person) => {
                const isFriend = friendIds.has(person.id);
                const requested = outgoingIds.has(person.id);
                return (
                  <div className="person-row" key={person.id}>
                    <ProfileAvatar name={person.name} image={person.image} />
                    <button className="person-info person-detail-trigger" type="button" onClick={() => setSelectedPerson(person)}>
                      <strong>{person.name ?? 'Atleta'}</strong><span>{person.username ? `@${person.username}` : 'TechArena'}</span>
                    </button>
                    <div className="d-flex gap-2">
                      <Button size="sm" variant="outline-secondary" onClick={() => setSelectedPerson(person)}>Detalhes</Button>
                      <Button size="sm" variant={isFriend ? 'outline-success' : 'outline-primary'} disabled={isFriend || requested || busyFriendId === person.id} onClick={() => void requestFriend(person.id)}>
                        {isFriend ? 'Amigos' : requested ? 'Solicitado' : 'Adicionar'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card.Body>
      </Card>

      <section className="content-section">
        <div className="section-title-row"><div><span className="eyebrow">AGUARDANDO RESPOSTA</span><h2>Solicitações recebidas</h2></div><span className="count-pill">{incoming.length}</span></div>
        {incoming.length === 0 ? (
          <Card className="content-card"><Card.Body>Nenhuma solicitação pendente por enquanto.</Card.Body></Card>
        ) : (
          <div className="people-list content-card">
            {incoming.map((friend) => (
              <div className="person-row" key={friend.id}>
                <ProfileAvatar name={friend.user.name} image={friend.user.image} />
                <button className="person-info person-detail-trigger" type="button" onClick={() => setSelectedPerson(friend.user)}>
                  <strong>{friend.user.name ?? 'Atleta'}</strong><span>{friend.user.username ? `@${friend.user.username}` : 'Solicitação de amizade'}</span>
                </button>
                <div className="d-flex gap-2">
                  <Button size="sm" onClick={() => void friendAction(friend.id, 'accept')} disabled={busyFriendId === friend.id}>Aceitar</Button>
                  <Button size="sm" variant="outline-secondary" onClick={() => void friendAction(friend.id, 'block')} disabled={busyFriendId === friend.id}>Bloquear</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="content-section">
        <div className="section-title-row"><div><span className="eyebrow">SUA REDE</span><h2>Amizades</h2></div><span className="count-pill">{groups?.friends.total ?? 0}</span></div>
        {loading && <LoadingState />}
        {!loading && !groups?.friends.items.length && <EmptyState icon="bi-people" title="Sua rede está começando" description="Adicione atletas para combinar partidas e conversar em tempo real." />}
        {!!groups?.friends.items.length && (
          <div className="people-list content-card">
            {groups.friends.items.map((friend) => (
              <div className="person-row" key={friend.id}>
                <ProfileAvatar name={friend.user.name} image={friend.user.image} />
                <button className="person-info person-detail-trigger" type="button" onClick={() => setSelectedPerson(friend.user)}>
                  <strong>{friend.user.name ?? 'Atleta'}</strong><span>{friend.user.username ? `@${friend.user.username}` : 'Amizade aceita'}</span>
                </button>
                <div className="d-flex gap-2">
                  <Button size="sm" variant="outline-secondary" onClick={() => setSelectedPerson(friend.user)}>Detalhes</Button>
                  <Button size="sm" onClick={() => navigate(`/chat/direct/${friend.user.id}`)}>Conversar</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <Modal show={selectedPerson !== null} onHide={() => setSelectedPerson(null)} centered>
        <Modal.Header closeButton><Modal.Title>Perfil do atleta</Modal.Title></Modal.Header>
        <Modal.Body>
          {selectedPerson && (
            <div className="profile-detail">
              {selectedPerson.image
                ? <Image className="profile-detail-image" src={selectedPerson.image} alt={`Foto de ${selectedPerson.name ?? 'atleta'}`} roundedCircle />
                : <ProfileAvatar name={selectedPerson.name} image={null} className="person-avatar profile-detail-avatar" />}
              <h3>{selectedPerson.name ?? 'Atleta'}</h3>
              <p>{selectedPerson.username ? `@${selectedPerson.username}` : 'Nome de usuário não informado'}</p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
