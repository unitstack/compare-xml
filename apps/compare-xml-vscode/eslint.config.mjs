import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import eslintConfig from '@compare-xml/eslint-config/base-ts';

export default defineConfig([
  eslintConfig,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  globalIgnores(['dist/**', 'node_modules/**', '.coverage/**', 'scripts/**']),
]);
