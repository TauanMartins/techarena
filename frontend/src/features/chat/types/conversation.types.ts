import type {
  AppointmentMembership,
  FriendGroups,
  TeamMembership,
} from "../../../shared/types";
import type { ConversationKind } from "../hooks/realtime";

export interface Conversation {
  id: string;
  kind: ConversationKind;
  label: string;
  otherUserId?: string;
  username?: string | null;
  image?: string | null;
  detail?: string;
  description?: string | null;
  scheduledAt?: string;
  status?: string;
  role?: string;
}

export function buildConversations(
  friends: FriendGroups,
  teams: TeamMembership[],
  appointments: AppointmentMembership[],
): Conversation[] {
  const direct: Conversation[] = friends.friends.items.map((friend) => ({
    id: friend.user.id,
    kind: "direct",
    label: friend.user.name ?? friend.user.username ?? "Atleta",
    otherUserId: friend.user.id,
    username: friend.user.username,
    image: friend.user.image,
    detail: "Amizade",
  }));
  const teamConversations: Conversation[] = teams.map((team) => ({
    id: team.id,
    kind: "team",
    label: team.name,
    image: team.image,
    description: team.description,
    role: team.role,
    detail: "Equipe",
  }));
  const appointmentConversations: Conversation[] = appointments.map(
    (appointment) => ({
      id: appointment.id,
      kind: "appointment",
      label: appointment.title,
      description: appointment.description,
      scheduledAt: appointment.scheduledAt,
      status: appointment.status,
      detail: new Date(appointment.scheduledAt).toLocaleDateString("pt-BR"),
    }),
  );
  return [...direct, ...teamConversations, ...appointmentConversations];
}
