import babelParser from '@babel/eslint-parser';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

// Oxlint owns correctness rules; ESLint applies the shared Prettier formatting.
// Babel parses TS/TSX without depending on the TypeScript compiler version.
export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'dist-ssr/**',
      'coverage/**',
      'public/**',
      'src/assets/**',
    ],
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          babelrc: false,
          configFile: false,
          parserOpts: {
            plugins: ['typescript', 'jsx'],
          },
        },
      },
    },
  },
  prettierRecommended,
];
