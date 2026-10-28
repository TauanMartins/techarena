export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  permission: string | null;
  username: string | null;
  birthDate: string | null;
  gender: string | null;
  image: string | null;
  createdAt: Date;
}
export type ProfileChanges = Partial<
  Pick<UserProfile, 'name' | 'username' | 'birthDate' | 'gender' | 'image'>
>;
