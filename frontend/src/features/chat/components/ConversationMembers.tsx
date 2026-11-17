import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import { api } from '../../../lib/api-client';
import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';
import { ErrorState, LoadingState } from '../../../components/ui/Feedback';
export function ConversationMembers({
  token,
  teamId,
}: {
  token: string;
  teamId: string;
}) {
  const [page, setPage] = useState(1);
  const members = useQuery({
    queryKey: ['conversationMembers', teamId, page],
    queryFn: () => api.listTeamMembers(token, teamId, page),
  });
  return (
    <section
      className="w-100 text-start border-top pt-3 mt-3"
      aria-label="Pessoas da equipe"
    >
      <h3 className="h6">Quem faz parte</h3>
      {members.isPending ? (
        <LoadingState label="Carregando participantes..." />
      ) : members.error ? (
        <ErrorState message="Não foi possível carregar os participantes." />
      ) : (
        <ul className="list-unstyled mb-0">
          {members.data?.items.map((member) => (
            <li
              className="d-flex align-items-center gap-3 py-2"
              key={member.id}
            >
              <ProfileAvatar
                name={member.name}
                image={member.image}
              />
              <div>
                <strong>{member.name ?? member.username ?? 'Atleta'}</strong>
                <div className="small text-body-secondary">
                  {member.role === 'captain' ? 'Capitão' : 'Membro'}
                  {member.username ? ` · @${member.username}` : ''}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {(page > 1 || members.data?.hasNextPage) && (
        <div className="d-flex gap-2 mt-2">
          <Button
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Anterior
          </Button>
          <Button
            size="sm"
            disabled={!members.data?.hasNextPage}
            onClick={() => setPage((value) => value + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
    </section>
  );
}
