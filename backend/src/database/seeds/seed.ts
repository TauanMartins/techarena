import dataSource from '../data-source.js';
import {
  Arena,
  Material,
  Permission,
  Preference,
  Schedule,
  Sport,
  SportArena,
  SportMaterial,
} from '../entities/index.js';
import reference from './reference-data.json' with { type: 'json' };

await dataSource.initialize();
try {
  await dataSource.transaction(async (manager) => {
    await manager
      .getRepository(Permission)
      .upsert(reference.permission, ['id']);
    await manager
      .getRepository(Preference)
      .upsert(reference.preference, ['id']);
    await manager.getRepository(Sport).upsert(reference.sport, ['id']);
    await manager.getRepository(Material).upsert(reference.material, ['id']);
    await manager.getRepository(Arena).upsert(reference.arena, ['id']);
    await manager.getRepository(Schedule).upsert(
      Array.from({ length: 36 }, (_, slot) => ({
        horary: `${String(6 + Math.floor(slot / 2)).padStart(2, '0')}:${slot % 2 === 0 ? '00' : '30'}:00`,
      })),
      ['horary'],
    );
    await manager
      .getRepository(SportMaterial)
      .upsert(reference.sport_material, ['sportId', 'materialId']);
    await manager
      .getRepository(SportArena)
      .upsert(reference.sport_arena, ['sportId', 'arenaId']);
    // Explicit legacy IDs must not leave the next generated ID behind MAX(id).
    for (const table of [
      'permission',
      'preference',
      'sport',
      'material',
      'arena',
    ]) {
      await manager.query(
        `SELECT setval(pg_get_serial_sequence('public.${table}', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM public.${table}`,
      );
    }
  });
  console.log('Reference data seeded.');
} finally {
  await dataSource.destroy();
}
