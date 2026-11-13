import { PersonListItem } from '../../../components/ui/PersonListItem';
import { LoadingState } from '../../../components/ui/Feedback';
import type { TeamMember } from '../types/teams.types';

export function TeamMembersList({
  members,
  loading,
}: {
  members: TeamMember[];
  loading: boolean;
}) {
  return (
    <>
      <h3 className="h6">Membros ({members.length})</h3>
      {loading && <LoadingState label="Carregando membros..." />}
      {!loading && !members.length && (
        <p className="text-secondary">Nenhum membro encontrado.</p>
      )}
      <div className="list-group rounded-3 mb-3">
        {members.map((member) => (
          <PersonListItem
            key={member.id}
            name={member.name}
            image={member.image}
            description={member.username ? `@${member.username}` : member.role}
          >
            <span className="badge rounded-pill bg-success-subtle text-success-emphasis text-capitalize">
              {member.role === 'captain' ? 'Capitão' : 'Membro'}
            </span>
          </PersonListItem>
        ))}
      </div>
    </>
  );
}
