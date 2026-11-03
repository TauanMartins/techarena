import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Card from "react-bootstrap/Card";
import { useAuth } from "../auth/useAuth";
import { EmptyState, ErrorState, LoadingState, PageHeading } from "../components/ui/Feedback";
import { AthleteDetailsModal } from "../features/community/components/AthleteDetailsModal";
import { AthleteDirectory } from "../features/community/components/AthleteDirectory";
import { FriendSections } from "../features/community/components/FriendSections";
import { useAthleteDirectory, useFriendGroups, useFriendMutations } from "../features/community/api/community.api";
import type { UserCard } from "../features/community/types/community.types";

export function CommunityPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const token = session!.access_token;
  const userId = session!.user.id;
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<UserCard | null>(null);
  const groupsQuery = useFriendGroups(token, userId);
  const directoryQuery = useAthleteDirectory(token, userId, submittedSearch);
  const mutations = useFriendMutations(token, userId);
  const groups = groupsQuery.data;
  const people = directoryQuery.data ?? [];
  const incoming = groups?.receivedFriends.items ?? [];
  const friends = groups?.friends.items ?? [];
  const friendIds = new Set(friends.map((friend) => friend.user.id));
  const requestedIds = new Set(groups?.requestedFriends.items.map((friend) => friend.user.id) ?? []);
  const error = groupsQuery.error ?? directoryQuery.error ?? mutations.request.error ?? mutations.decide.error;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (search.trim().length < 2) { setSearchError("Digite pelo menos 2 caracteres para buscar atletas."); return; }
    setSearchError(null); setSubmittedSearch(search.trim());
  }
  async function requestFriend(id: string) {
    try { await mutations.request.mutateAsync(id); setNotice("Solicitação de amizade enviada."); } catch { setNotice(null); }
  }
  async function decideFriend(friendId: string, action: "accept" | "block") {
    try { await mutations.decide.mutateAsync({ friendId, action }); setNotice(action === "accept" ? "Solicitação aceita. Vocês já podem conversar." : "Atleta bloqueado."); } catch { setNotice(null); }
  }

  return <>
    <PageHeading eyebrow="CONEXÕES" title="Comunidade" description="Encontre atletas, construa amizades e combine o próximo jogo." />
    {notice && <div className="inline-notice" role="status"><i className="bi bi-check-circle-fill" />{notice}</div>}
    {error && <ErrorState message={error instanceof Error ? error.message : "Não foi possível carregar a comunidade."} />}
    {searchError && <ErrorState message={searchError} />}
    <Card className="content-card mb-4"><Card.Body><div className="section-title-row"><div><span className="eyebrow">NOVAS CONEXÕES</span><h2>Encontrar atletas</h2></div></div>
      <AthleteDirectory people={people} friends={friendIds} requested={requestedIds} search={search} onSearchChange={setSearch} onSearch={submitSearch} onDetails={setSelectedPerson} onRequest={(id) => void requestFriend(id)} busy={mutations.request.isPending} />
      {directoryQuery.isFetching && <LoadingState label="Buscando atletas..." />}
      {!directoryQuery.isFetching && !people.length && <EmptyState icon="bi-person-search" title={search.trim().length >= 2 ? "Nenhum atleta encontrado" : "Busque atletas da comunidade"} description={search.trim().length >= 2 ? "Experimente buscar por outro nome ou usuário." : "Digite pelo menos 2 caracteres para encontrar pessoas."} />}
    </Card.Body></Card>
    <FriendSections incoming={incoming} friends={friends} onDetails={setSelectedPerson} onAccept={(id) => void decideFriend(id, "accept")} onBlock={(id) => void decideFriend(id, "block")} onChat={(person) => navigate(`/chat/direct/${person.id}`)} busy={mutations.decide.isPending} />
    {groupsQuery.isPending && <LoadingState />}
    <AthleteDetailsModal person={selectedPerson} onHide={() => setSelectedPerson(null)} />
  </>;
}
