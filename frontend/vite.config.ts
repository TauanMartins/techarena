import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
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
