import { ProfileAvatar } from "../../../components/ui/ProfileAvatar";
import { LoadingState } from "../../../components/ui/Feedback";
import type { TeamMember } from "../types/teams.types";

export function TeamMembersList({ members, loading }: { members: TeamMember[]; loading: boolean }) {
  return <>
    <h3 className="h6">Membros ({members.length})</h3>
    {loading && <LoadingState label="Carregando membros..." />}
    {!loading && !members.length && <p className="text-secondary">Nenhum membro encontrado.</p>}
    <div className="people-list mb-3">{members.map((member) => <div className="person-row" key={member.id}>
      <ProfileAvatar name={member.name} image={member.image} /><div className="person-info"><strong>{member.name ?? "Atleta"}</strong><span>{member.username ? `@${member.username}` : member.role}</span></div><span className="team-role">{member.role === "captain" ? "Capitão" : "Membro"}</span>
    </div>)}</div>
  </>;
}
