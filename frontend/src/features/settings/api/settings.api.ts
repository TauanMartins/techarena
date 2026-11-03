import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api-client";

export const settingsApi = { profile: api.getProfile, updateProfile: api.updateProfile, sports: api.getSports, favorites: api.getFavoriteSports, replaceFavorites: api.replaceFavoriteSports, theme: api.getTheme, setTheme: api.setTheme };

export function useSettingsData(token: string, userId: string) {
  return useQuery({ queryKey: ["settings", userId], queryFn: async () => {
    const [sports, favorites] = await Promise.all([settingsApi.sports(token), settingsApi.favorites(token)]);
    return { sports: sports.items, favorites };
  } });
}

export function useUpdateProfile(token: string, onUpdated?: () => Promise<unknown>) {
  return useMutation({ mutationFn: (payload: Parameters<typeof settingsApi.updateProfile>[1]) => settingsApi.updateProfile(token, payload), onSuccess: onUpdated });
}

export function useSaveFavoriteSports(token: string, userId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (sportIds: string[]) => settingsApi.replaceFavorites(token, sportIds), onSuccess: () => client.invalidateQueries({ queryKey: ["settings", userId] }) });
}

export function useSavePreferences(token: string, userId: string, saveTheme: (theme: "light" | "dark" | "system") => Promise<void>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ sportIds, theme }: { sportIds: string[]; theme: "light" | "dark" | "system" }) => Promise.all([
      settingsApi.replaceFavorites(token, sportIds), saveTheme(theme),
    ]),
    onSuccess: () => client.invalidateQueries({ queryKey: ["settings", userId] }),
  });
}
