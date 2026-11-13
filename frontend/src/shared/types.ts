export interface Page<T> {
  items: T[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Profile {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  permission: string | null;
  email: string | null;
  birthDate: string | null;
  gender: string | null;
  createdAt: string;
}

export interface Sport {
  id: string;
  name: string;
  defaultPlayers: number;
}

export interface FavoriteSports {
  maxFavorites: number;
  remainingSlots: number;
  items: Pick<Sport, 'id' | 'name'>[];
}

export interface Arena {
  id: string;
  address: string;
  lat: number;
  longitude: number;
  image: string | null;
  isLeagueOnly: boolean;
  sportIds: string[];
  distanceKm: number | null;
}

export interface Schedule {
  id: string;
  horary: string;
}

export interface Appointment {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  status: 'scheduled' | 'in_progress' | 'finished' | 'canceled';
  organizerId: string;
  arenaId: string | null;
  sportId: string | null;
  scheduleId: string | null;
  arenaAddress: string | null;
  arenaImage: string | null;
  sportName: string | null;
  maxPlayers: number | null;
  players: number;
  startingPlayers: number;
  isInside: boolean;
  distanceKm: number | null;
  participants: AppointmentParticipant[];
}

export interface AppointmentParticipant {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  holder: boolean;
}

export interface AppointmentMembership {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  status: 'scheduled' | 'in_progress' | 'finished' | 'canceled';
  organizerId: string;
  isOrganizer: boolean;
  maxPlayers: number | null;
  holder: boolean;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  createdAt: string;
}

export interface TeamMembership {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  joinedAt: string | null;
  role: string;
}

export interface TeamMember {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  role: 'captain' | 'member';
  joinedAt: string | null;
}

export interface UserCard {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

export interface Friend {
  id: string;
  status: 'pending' | 'accepted' | 'blocked';
  user: UserCard;
}

export interface FriendGroups {
  friends: Page<Friend>;
  requestedFriends: Page<Friend>;
  receivedFriends: Page<Friend>;
}

export interface MembershipRequest {
  id: string;
  teamId: string;
  teamName: string;
  userId: string;
  userName: string | null;
  createdBy: string;
  kind: 'invitation' | 'request';
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface LeagueSummary {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  ownerId: string | null;
  ownerName: string | null;
  sportId: string | null;
  sportName: string | null;
  tournamentFormat: 'round_robin' | 'knockout' | 'groups_knockout';
  status: 'open' | 'active' | 'completed' | 'canceled';
  groupCount: number;
  qualifiersPerGroup: number;
  createdAt: string;
  teamCount: number;
  matchCount: number;
  completedMatchCount: number;
  isOwner: boolean;
}

export interface LeagueTeam {
  id: string;
  name: string;
  image: string | null;
  captainName: string | null;
  groupNumber: number | null;
}

export interface LeagueTeamInvitation {
  id: string;
  leagueId: string;
  leagueName: string;
  teamId: string;
  teamName: string;
  invitedAt: string;
}

export interface LeagueMatch {
  id: string;
  appointmentId: string;
  matchNumber: number;
  scheduledAt: string;
  status: Appointment['status'];
  resultAllowed: boolean;
  phase: 'manual' | 'group' | 'knockout';
  roundNumber: number;
  groupNumber: number | null;
  arenaAddress: string | null;
  homeTeam: LeagueTeam;
  awayTeam: LeagueTeam;
  result: {
    winnerTeamId: string | null;
    homeScore: number;
    awayScore: number;
  } | null;
}

export interface LeagueStanding {
  teamId: string;
  teamName: string;
  image: string | null;
  groupNumber: number | null;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  scoreFor: number;
  scoreAgainst: number;
}

export interface LeagueDetails {
  league: LeagueSummary;
  teams: LeagueTeam[];
  invitations: LeagueTeamInvitation[];
  matches: LeagueMatch[];
  standings: LeagueStanding[];
  myCaptainTeamIds: string[];
}

export interface LeagueArena {
  id: string;
  address: string;
  image: string | null;
}
