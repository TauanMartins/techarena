import type { FavoriteSports, Profile } from '../../shared/types';
import { apiRequest } from './api-request';
export const profileClient = {
  getProfile: (token: string) => apiRequest<Profile>('/users/me', token),
  updateProfile: (
    token: string,
    payload: Partial<
      Pick<Profile, 'name' | 'username' | 'birthDate' | 'gender' | 'image'>
    >,
  ) =>
    apiRequest<Profile>('/users/me', token, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  getFavoriteSports: (token: string) =>
    apiRequest<FavoriteSports>('/users/me/sports', token),
  replaceFavoriteSports: (token: string, sportIds: string[]) =>
    apiRequest<FavoriteSports>('/users/me/sports', token, {
      method: 'PUT',
      body: JSON.stringify({ sportIds }),
    }),
  getTheme: (token: string) =>
    apiRequest<{ theme: 'light' | 'dark' | 'system' }>(
      '/users/me/theme',
      token,
    ),
  setTheme: (token: string, theme: 'light' | 'dark' | 'system') =>
    apiRequest<{ theme: 'light' | 'dark' | 'system' }>(
      '/users/me/theme',
      token,
      {
        method: 'PUT',
        body: JSON.stringify({ theme }),
      },
    ),
};
