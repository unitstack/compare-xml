import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';
import stylistic from '@stylistic/eslint-plugin';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx,ts,tsx,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
    },
    extends: [js.configs.recommended, eslintConfigPrettier],
    plugins: {
      import: importPlugin,
      '@stylistic': stylistic,
      prettier: eslintPluginPrettier,
    },
    rules: {
      'prettier/prettier': [
        'error',
        {
          semi: true,
          trailingComma: 'all',
          singleQuote: true,
          tabWidth: 2,
          bracketSpacing: true,
        },
      ],
      eqeqeq: ['error', 'always'],
      'import/no-duplicates': 'error',
      '@stylistic/quote-props': ['error', 'as-needed'],
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: false }],
      '@stylistic/linebreak-style': ['error', 'unix'],
    },
  },
]);
