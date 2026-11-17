export interface BookingContext {
  arena: {
    id: string;
    isLeagueOnly: boolean;
    lat: number;
    longitude: number;
  } | null;
  sport: { id: string; name: string; defaultPlayers: number } | null;
  supportsSport: boolean;
  schedule: { id: string; horary: string } | null;
}
export interface BookingDraft {
  organizerId: string;
  arenaId: string;
  sportId: string;
  scheduleId: string;
  title: string;
  description: string | null;
  scheduledAt: Date;
  status: 'scheduled';
  maxPlayers: number;
  holder: boolean;
  lat: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
}
