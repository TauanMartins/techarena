export const PROFILE_ACCESS = Symbol('PROFILE_ACCESS');
export interface ProfileAccess {
  ensureExists(id: string): Promise<void>;
  ensureAdult(id: string): Promise<void>;
}
