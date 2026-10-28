import type {
  AppointmentSummary,
  Page,
  PageRequest,
  ProfileChanges,
  SportSummary,
  TeamSummary,
  Theme,
  UserCard,
  UserProfile,
} from './user.js';
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export interface UserRepository {
  findById(id: string): Promise<UserProfile | null>;
  search(search: string, pagination: PageRequest): Promise<Page<UserCard>>;
  update(id: string, changes: ProfileChanges): Promise<UserProfile>;
  getTheme(id: string): Promise<Theme>;
  setTheme(id: string, theme: Theme): Promise<void>;
  getSports(id: string): Promise<SportSummary[]>;
  replaceSports(id: string, sportIds: string[]): Promise<SportSummary[]>;
  getTeams(id: string, pagination: PageRequest): Promise<Page<TeamSummary>>;
  getAppointments(
    id: string,
    pagination: PageRequest,
  ): Promise<Page<AppointmentSummary>>;
  joinAppointment(
    id: string,
    appointmentId: string,
    holder: boolean,
    now: Date,
  ): Promise<AppointmentSummary>;
}
