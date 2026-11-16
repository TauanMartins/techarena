import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string };

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Bootstrap 5.3 ainda depende de @import e APIs Sass legadas.
        quietDeps: true,
        silenceDeprecations: ['import'],
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        'src/**/types/**',
        'src/**/types.ts',
        'src/**/index.ts',
        'src/test/**',
        'src/lib/**',
      ],
      thresholds: {
        lines: 80,
        statements: 75,
        branches: 68,
        functions: 68,
      },
    },
  },
});
