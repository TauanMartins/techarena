import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// A marca original é a única fonte. Arquivos derivados não são versionados.
const source = fileURLToPath(
  new URL('../src/assets/brand/logo-light.png', import.meta.url),
);
const output = new URL('../public/pwa/', import.meta.url);
await mkdir(output, { recursive: true });

for (const [name, size] of [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
]) {
  await sharp(source)
    .resize(size, size, { fit: 'contain', background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .png()
    .toFile(fileURLToPath(new URL(name, output)));
}

// O logo inteiro fica dentro do círculo seguro central do ícone maskable.
const mark = await sharp(source)
  .resize(280, 280, { fit: 'contain', background: '#ffffff' })
  .flatten({ background: '#ffffff' })
  .png()
  .toBuffer();
await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 3,
    background: '#ffffff',
  },
})
  .composite([{ input: mark, gravity: 'centre' }])
  .png()
  .toFile(fileURLToPath(new URL('icon-maskable-512.png', output)));

console.log('Ícones Android e iOS gerados em public/pwa.');
