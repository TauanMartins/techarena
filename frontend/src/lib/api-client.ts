import type {
  Arena,
  Appointment,
  AppointmentMembership,
  FavoriteSports,
  FriendGroups,
  LeagueArena,
  LeagueDetails,
  LeagueSummary,
  LeagueTeamInvitation,
  MembershipRequest,
  Page,
  Profile,
  Schedule,
  Sport,
  Team,
  TeamMember,
  TeamMembership,
  UserCard,
} from "../shared/types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(
      response.ok
        ? "Não foi possível processar a resposta."
        : "Não foi possível concluir a solicitação. Tente novamente.",
      response.status,
    );
  }
  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : "Não foi possível concluir a solicitação. Tente novamente.";
    throw new ApiError(message, response.status);
  }
  return body as T;
}

function queryString(
  params: Record<string, string | number | boolean | undefined>,
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const encoded = query.toString();
  return encoded ? `?${encoded}` : "";
}

export const api = {
  getProfile: (token: string) => apiRequest<Profile>("/users/me", token),
  ensureChatAccess: (token: string, topic: string) =>
    apiRequest<{ topic: string; kind: "direct" | "team" | "appointment" }>(
      "/chat/access",
      token,
      {
        method: "POST",
        body: JSON.stringify({ topic }),
      },
    ),
  updateProfile: (
    token: string,
    payload: Partial<
      Pick<Profile, "name" | "username" | "birthDate" | "gender" | "image">
    >,
  ) =>
    apiRequest<Profile>("/users/me", token, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  getSports: (token: string, search?: string) =>
    apiRequest<Page<Sport>>(
      `/sports${queryString({ page: 1, limit: 50, search })}`,
      token,
    ),
  getFavoriteSports: (token: string) =>
    apiRequest<FavoriteSports>("/users/me/sports", token),
  replaceFavoriteSports: (token: string, sportIds: string[]) =>
    apiRequest<FavoriteSports>("/users/me/sports", token, {
      method: "PUT",
      body: JSON.stringify({ sportIds }),
    }),
  getTheme: (token: string) =>
    apiRequest<{ theme: "light" | "dark" | "system" }>(
      "/users/me/theme",
      token,
    ),
  setTheme: (token: string, theme: "light" | "dark" | "system") =>
    apiRequest<{ theme: "light" | "dark" | "system" }>(
      "/users/me/theme",
      token,
      {
        method: "PUT",
        body: JSON.stringify({ theme }),
      },
    ),

  listAppointments: (
    token: string,
    params: {
      page?: number;
      limit?: number;
      sportId?: string;
      arenaId?: string;
      orderByTime?: "recent" | "future";
      distance?: "near" | "far";
      preferSports?: boolean;
      lat?: number;
      longitude?: number;
    } = {},
  ) =>
    apiRequest<Page<Appointment>>(
      `/appointments${queryString({ page: 1, limit: 20, orderByTime: "future", ...params })}`,
      token,
    ),
  listMyAppointments: (token: string, page = 1) =>
    apiRequest<Page<AppointmentMembership>>(
      `/users/me/appointments${queryString({ page, limit: 20, from: new Date().toISOString(), sortOrder: "asc" })}`,
      token,
    ),
  joinAppointment: (token: string, appointmentId: string) =>
    apiRequest<AppointmentMembership>(
      `/users/me/appointments/${appointmentId}`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ holder: true }),
      },
    ),
  getAvailability: (
    token: string,
    arenaId: string,
    sportId: string,
    date: string,
  ) =>
    apiRequest<{ items: Schedule[] }>(
      `/horary${queryString({ arenaId, sportId, date })}`,
      token,
    ),
  createAppointment: (
    token: string,
    payload: {
      arenaId: string;
      sportId: string;
      date: string;
      scheduleId: string;
      title: string;
      description?: string;
      holder: boolean;
      maxPlayers?: number;
    },
  ) =>
    apiRequest<Appointment>("/appointments", token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listArenas: (token: string, sportId?: string) =>
    apiRequest<Page<Arena>>(
      `/arenas${queryString({ page: 1, limit: 50, sportId })}`,
      token,
    ),

  listTeams: (token: string, search = "") =>
    apiRequest<Page<Team>>(
      `/team${queryString({ page: 1, limit: 20, search: search || undefined })}`,
      token,
    ),
  listMyTeams: (token: string) =>
    apiRequest<Page<TeamMembership>>("/users/me/teams?page=1&limit=50", token),
  createTeam: (token: string, name: string, description?: string) =>
    apiRequest<Team>("/team", token, {
      method: "POST",
      body: JSON.stringify({ name, description }),
    }),
  requestToJoinTeam: (token: string, teamId: string) =>
    apiRequest<MembershipRequest>("/users/me/team-requests", token, {
      method: "POST",
      body: JSON.stringify({ teamId }),
    }),
  inviteToTeam: (token: string, teamId: string, userId: string) =>
    apiRequest<MembershipRequest>("/team/user", token, {
      method: "POST",
      body: JSON.stringify({ teamId, userId }),
    }),
  decideTeamRequest: (
    token: string,
    teamId: string,
    userId: string,
    action: "accept" | "decline",
  ) =>
    apiRequest<MembershipRequest>("/team/user", token, {
      method: "PUT",
      body: JSON.stringify({ teamId, userId, action }),
    }),
  listTeamRequests: (token: string, teamId: string) =>
    apiRequest<Page<MembershipRequest>>(
      `/team/user${queryString({ teamId, page: 1, limit: 50 })}`,
      token,
    ),
  listTeamMembers: (token: string, teamId: string) =>
    apiRequest<Page<TeamMember>>(
      `/team/members${queryString({ teamId, page: 1, limit: 50 })}`,
      token,
    ),
  respondToTeamInvitation: (
    token: string,
    requestId: string,
    action: "accept" | "decline",
  ) =>
    apiRequest<MembershipRequest>(
      `/users/me/team-invitations/${requestId}`,
      token,
      {
        method: "PUT",
        body: JSON.stringify({ action }),
      },
    ),
  listMyTeamRequests: (token: string) =>
    apiRequest<Page<MembershipRequest>>(
      "/users/me/team-requests?page=1&limit=50",
      token,
    ),

  listLeagues: (token: string) =>
    apiRequest<{ items: LeagueSummary[] }>("/leagues", token),
  getLeague: (token: string, leagueId: string) =>
    apiRequest<LeagueDetails>(`/leagues/${leagueId}`, token),
  createLeague: (
    token: string,
    payload: {
      name: string;
      description?: string;
      sportId: string;
      tournamentFormat: LeagueSummary["tournamentFormat"];
      groupCount?: number;
      qualifiersPerGroup?: number;
    },
  ) =>
    apiRequest<LeagueSummary>("/leagues", token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateLeague: (
    token: string,
    leagueId: string,
    payload: {
      name?: string;
      description?: string | null;
      sportId?: string;
      tournamentFormat?: LeagueSummary["tournamentFormat"];
      groupCount?: number;
      qualifiersPerGroup?: number;
    },
  ) =>
    apiRequest<{ success: boolean }>(`/leagues/${leagueId}`, token, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  setLeagueStatus: (
    token: string,
    leagueId: string,
    status: "completed" | "canceled",
  ) =>
    apiRequest<{ success: boolean }>(`/leagues/${leagueId}/status`, token, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
  generateLeagueFixtures: (
    token: string,
    leagueId: string,
    payload: {
      arenaId: string;
      scheduleId: string;
      date: string;
      daysBetweenMatches: number;
    },
  ) =>
    apiRequest<{ success: boolean }>(`/leagues/${leagueId}/fixtures`, token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  generateLeagueNextRound: (
    token: string,
    leagueId: string,
    payload: {
      arenaId: string;
      scheduleId: string;
      date: string;
      daysBetweenMatches: number;
    },
  ) =>
    apiRequest<{ success: boolean }>(
      `/leagues/${leagueId}/rounds/next`,
      token,
      { method: "POST", body: JSON.stringify(payload) },
    ),
  rescheduleLeagueMatch: (
    token: string,
    leagueId: string,
    matchId: string,
    payload: {
      homeTeamId: string;
      awayTeamId: string;
      arenaId: string;
      scheduleId: string;
      date: string;
    },
  ) =>
    apiRequest<{ success: boolean }>(
      `/leagues/${leagueId}/matches/${matchId}`,
      token,
      { method: "PUT", body: JSON.stringify(payload) },
    ),
  cancelLeagueMatch: (token: string, leagueId: string, matchId: string) =>
    apiRequest<{ success: boolean }>(
      `/leagues/${leagueId}/matches/${matchId}`,
      token,
      { method: "DELETE" },
    ),
  registerLeagueTeam: (token: string, leagueId: string, teamId: string) =>
    apiRequest<{ success: boolean }>(`/leagues/${leagueId}/teams`, token, {
      method: "POST",
      body: JSON.stringify({ teamId }),
    }),
  removeLeagueTeam: (token: string, leagueId: string, teamId: string) =>
    apiRequest<{ success: boolean }>(
      `/leagues/${leagueId}/teams/${teamId}`,
      token,
      { method: "DELETE" },
    ),
  inviteLeagueTeam: (token: string, leagueId: string, teamId: string) =>
    apiRequest<{ success: boolean }>(
      `/leagues/${leagueId}/team-invitations`,
      token,
      { method: "POST", body: JSON.stringify({ teamId }) },
    ),
  listLeagueTeamInvitations: (token: string) =>
    apiRequest<{ items: LeagueTeamInvitation[] }>(
      "/leagues/team-invitations",
      token,
    ),
  respondToLeagueTeamInvitation: (
    token: string,
    invitationId: string,
    action: "accept" | "decline",
  ) =>
    apiRequest<{ success: boolean }>(
      `/leagues/team-invitations/${invitationId}`,
      token,
      { method: "PUT", body: JSON.stringify({ action }) },
    ),
  getLeagueArenas: (token: string, leagueId: string) =>
    apiRequest<{ items: LeagueArena[] }>(`/leagues/${leagueId}/arenas`, token),
  getLeagueAvailability: (
    token: string,
    leagueId: string,
    arenaId: string,
    date: string,
  ) =>
    apiRequest<{ items: Schedule[] }>(
      `/leagues/${leagueId}/availability${queryString({ arenaId, date })}`,
      token,
    ),
  createLeagueMatch: (
    token: string,
    leagueId: string,
    payload: {
      homeTeamId: string;
      awayTeamId: string;
      arenaId: string;
      scheduleId: string;
      date: string;
    },
  ) =>
    apiRequest<{ success: boolean }>(`/leagues/${leagueId}/matches`, token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  recordLeagueResult: (
    token: string,
    leagueId: string,
    matchId: string,
    payload: { homeScore: number; awayScore: number },
  ) =>
    apiRequest<{ success: boolean }>(
      `/leagues/${leagueId}/matches/${matchId}/result`,
      token,
      { method: "PUT", body: JSON.stringify(payload) },
    ),

  searchUsers: (token: string, search: string) =>
    apiRequest<Page<UserCard>>(
      `/users${queryString({ page: 1, limit: 20, search })}`,
      token,
    ),
  listFriends: (token: string) =>
    apiRequest<FriendGroups>("/friend?page=1&limit=50", token),
  requestFriend: (token: string, userId: string) =>
    apiRequest("/friend", token, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  decideFriend: (token: string, friendId: string, action: "accept" | "block") =>
    apiRequest("/friend", token, {
      method: "PUT",
      body: JSON.stringify({ friendId, action }),
    }),
};
