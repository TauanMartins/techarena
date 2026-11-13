import type { SubmitEvent } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import type {
  MembershipRequest,
  TeamMember,
  UserCard,
} from '../types/teams.types';
import { PersonListItem } from '../../../components/ui/PersonListItem';

export function TeamInvitePanel({
  members,
  requests,
  candidates,
  search,
  invitingUserId,
  onSearchChange,
  onSearchSubmit,
  onInvite,
  onDecideRequest,
}: {
  members: TeamMember[];
  requests: MembershipRequest[];
  candidates: UserCard[];
  search: string;
  invitingUserId: string | null;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onInvite: (user: UserCard) => void;
  onDecideRequest: (
    request: MembershipRequest,
    action: 'accept' | 'decline',
  ) => void;
}) {
  const pendingRequests = requests.filter(
    (request) => request.kind === 'request' && request.status === 'pending',
  );
  return (
    <>
      <h3 className="h6">Convidar atletas</h3>
      <Form
        className="d-flex flex-column flex-sm-row align-items-sm-center gap-2 border rounded-4 bg-body shadow-sm p-3 mb-3"
        onSubmit={onSearchSubmit}
      >
        <i
          className="bi bi-search"
          aria-hidden="true"
        />
        <Form.Control
          aria-label="Buscar atleta para convidar"
          placeholder="Buscar por nome ou usuário"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <Button
          type="submit"
          variant="outline-primary"
        >
          Buscar
        </Button>
      </Form>
      <div className="list-group rounded-3">
        {candidates.map((candidate) => {
          const alreadyMember = members.some(
            (member) => member.id === candidate.id,
          );
          const pending = requests.some(
            (request) =>
              request.userId === candidate.id && request.status === 'pending',
          );
          return (
            <PersonListItem
              key={candidate.id}
              name={candidate.name}
              image={candidate.image}
              description={
                candidate.username ? `@${candidate.username}` : 'TechArena'
              }
            >
              <Button
                size="sm"
                disabled={
                  alreadyMember || pending || invitingUserId === candidate.id
                }
                onClick={() => onInvite(candidate)}
              >
                {alreadyMember
                  ? 'Já participa'
                  : pending
                    ? 'Convite pendente'
                    : invitingUserId === candidate.id
                      ? 'Convidando...'
                      : 'Convidar'}
              </Button>
            </PersonListItem>
          );
        })}
      </div>
      {pendingRequests.length > 0 && (
        <>
          <hr />
          <h3 className="h6">Solicitações para entrar</h3>
          <div className="list-group rounded-3">
            {pendingRequests.map((request) => (
              <PersonListItem
                key={request.id}
                name={request.userName}
                image={null}
                description="Solicitou entrar na equipe"
              >
                <Button
                  size="sm"
                  onClick={() => onDecideRequest(request, 'accept')}
                >
                  Aceitar
                </Button>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => onDecideRequest(request, 'decline')}
                >
                  Recusar
                </Button>
              </PersonListItem>
            ))}
          </div>
        </>
      )}
    </>
  );
}
