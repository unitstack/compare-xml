import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfig from '@compare-xml/eslint-config/base-ts';

export default defineConfig([
  eslintConfig,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
      },
    },
  },
  globalIgnores(['dist/**', 'node_modules/**', '.coverage/**', 'scripts/**']),
]);
