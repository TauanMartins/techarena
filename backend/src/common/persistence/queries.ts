export const escapeLike = (value: string) => value.replace(/[\\%_]/g,'\\$&');
/** Both query parameters are bound; the arena alias is fixed by the repository. */
export const ARENA_DISTANCE_KM = 'ST_DistanceSphere(ST_SetSRID(ST_MakePoint(arena.longitude::double precision, arena.lat::double precision),4326), ST_SetSRID(ST_MakePoint(:longitude,:lat),4326))/1000.0';
