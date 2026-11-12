import { ProfileAvatar } from "../../../components/ui/ProfileAvatar";
import { LoadingState } from "../../../components/ui/Feedback";
import type { TeamMember } from "../types/teams.types";

export function TeamMembersList({ members, loading }: { members: TeamMember[]; loading: boolean }) {
  return <>
    <h3 className="h6">Membros ({members.length})</h3>
    {loading && <LoadingState label="Carregando membros..." />}
    {!loading && !members.length && <p className="text-secondary">Nenhum membro encontrado.</p>}
    <div className="list-group rounded-3 mb-3">{members.map((member) => <div className="list-group-item d-flex flex-wrap align-items-center gap-3 p-3" key={member.id}>
      <ProfileAvatar name={member.name} image={member.image} /><div className="d-flex flex-column gap-1 text-break me-auto"><strong>{member.name ?? "Atleta"}</strong><span>{member.username ? `@${member.username}` : member.role}</span></div><span className="badge rounded-pill bg-success-subtle text-success-emphasis text-capitalize">{member.role === "captain" ? "Capitão" : "Membro"}</span>
    </div>)}</div>
  </>;
}
