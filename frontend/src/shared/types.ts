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
