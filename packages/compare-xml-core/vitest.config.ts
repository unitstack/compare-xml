import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './.coverage',
      include: ['src/**/*.{js,ts}'],
      exclude: ['node_modules/', 'src/**/__tests__/', 'src/index.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
