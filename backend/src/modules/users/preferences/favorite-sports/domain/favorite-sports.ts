export interface SportSummary {
  id: string;
  name: string;
}

export const MAX_FAVORITE_SPORTS = 4;
export function favoriteSportsResult(items: SportSummary[]) {
  return {
    items,
    maxFavorites: MAX_FAVORITE_SPORTS,
    remainingSlots: Math.max(0, MAX_FAVORITE_SPORTS - items.length),
  };
}
