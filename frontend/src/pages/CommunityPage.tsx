import { useConfirmation } from '../components/ui/useConfirmation';
import { ToastNotice } from '../components/ui/ToastNotice';
import { useState, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import { useAuthenticatedSession } from '../auth/useAuthenticatedSession';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeading,
} from '../components/ui/Feedback';
import { AthleteDetailsModal } from '../features/community/components/AthleteDetailsModal';
import { AthleteDirectory } from '../features/community/components/AthleteDirectory';
import { FriendSections } from '../features/community/components/FriendSections';
import {
  useAthleteDirectory,
  useFriendGroups,
  useFriendMutations,
} from '../features/community/api/community.api';
import type { UserCard } from '../features/community/types/community.types';

export function CommunityPage() {
  const { token, userId } = useAuthenticatedSession();
  const navigate = useNavigate();
  const confirmation = useConfirmation();
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeRequiresAcknowledgment, setNoticeRequiresAcknowledgment] =
    useState(false);
  const [selectedPerson, setSelectedPerson] = useState<UserCard | null>(null);
  const groupsQuery = useFriendGroups(token, userId);
  const directoryQuery = useAthleteDirectory(token, userId, submittedSearch);
  const mutations = useFriendMutations(token, userId);
  const groups = groupsQuery.data;
  const people = directoryQuery.data ?? [];
  const incoming = groups?.receivedFriends.items ?? [];
  const friends = groups?.friends.items ?? [];
  const friendIds = new Set(friends.map((friend) => friend.user.id));
  const requestedIds = new Set(
    groups?.requestedFriends.items.map((friend) => friend.user.id) ?? [],
  );
  const error =
    groupsQuery.error ??
    directoryQuery.error ??
    mutations.request.error ??
    mutations.decide.error;

  function submitSearch(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (search.trim().length < 2) {
      setSearchError('Digite pelo menos 2 caracteres para buscar atletas.');
      return;
    }
    setSearchError(null);
    setSubmittedSearch(search.trim());
  }
  async function requestFriend(id: string) {
    try {
      await mutations.request.mutateAsync(id);
      setNoticeRequiresAcknowledgment(false);
      setNotice('Solicitação de amizade enviada.');
    } catch {
      setNotice(null);
    }
  }
  async function decideFriend(friendId: string, action: 'accept' | 'block') {
    try {
      await mutations.decide.mutateAsync({ friendId, action });
      setNoticeRequiresAcknowledgment(action === 'block');
      setNotice(
        action === 'accept'
          ? 'Solicitação aceita. Vocês já podem conversar.'
          : 'Atleta bloqueado.',
      );
    } catch {
      setNotice(null);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="CONEXÕES"
        title="Comunidade"
        description="Encontre atletas, construa amizades e combine o próximo jogo."
      />
      {notice && (
        <ToastNotice
          message={notice}
          requiresAcknowledgment={noticeRequiresAcknowledgment}
        />
      )}
      {error && (
        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar a comunidade.'
          }
        />
      )}
      {searchError && <ErrorState message={searchError} />}
      <Card className="border rounded-4 shadow-sm bg-body mb-4">
        <Card.Body>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
            <div>
              <span className="d-block small fw-semibold text-body-secondary mb-1">
                NOVAS CONEXÕES
              </span>
              <h2>Encontrar atletas</h2>
            </div>
          </div>
          <AthleteDirectory
            people={people}
            friends={friendIds}
            requested={requestedIds}
            search={search}
            onSearchChange={setSearch}
            onSearch={submitSearch}
            onDetails={setSelectedPerson}
            onRequest={(id) => void requestFriend(id)}
            busy={mutations.request.isPending}
          />
          {directoryQuery.isFetching && (
            <LoadingState label="Buscando atletas..." />
          )}
          {!directoryQuery.isFetching && !people.length && (
            <EmptyState
              icon="bi-person-search"
              title={
                search.trim().length >= 2
                  ? 'Nenhum atleta encontrado'
                  : 'Busque atletas da comunidade'
              }
              description={
                search.trim().length >= 2
                  ? 'Experimente buscar por outro nome ou usuário.'
                  : 'Digite pelo menos 2 caracteres para encontrar pessoas.'
              }
            />
          )}
        </Card.Body>
      </Card>
      <FriendSections
        incoming={incoming}
        friends={friends}
        onDetails={setSelectedPerson}
        onAccept={(id) => void decideFriend(id, 'accept')}
        onBlock={(id) =>
          confirmation.request({
            title: 'Bloquear atleta',
            message:
              'A conversa privada ficará indisponível e novas solicitações de amizade serão impedidas.',
            label: 'Bloquear',
            onConfirm: () => decideFriend(id, 'block'),
          })
        }
        onChat={(person) => navigate(`/chat/direct/${person.id}`)}
        onRemove={(id) =>
          confirmation.request({
            title: 'Desfazer amizade',
            message:
              'A conversa privada ficará indisponível. Vocês poderão enviar uma nova solicitação no futuro.',
            label: 'Desfazer amizade',
            onConfirm: async () => {
              await mutations.remove.mutateAsync(id);
              setNoticeRequiresAcknowledgment(true);
              setNotice('Amizade desfeita.');
            },
          })
        }
        busy={mutations.decide.isPending || mutations.remove.isPending}
      />
      {groupsQuery.isPending && <LoadingState />}
      {confirmation.dialog}
      <AthleteDetailsModal
        person={selectedPerson}
        onHide={() => setSelectedPerson(null)}
      />
    </>
  );
}
