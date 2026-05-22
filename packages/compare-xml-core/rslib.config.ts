import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    { format: 'esm', bundle: false, dts: true },
    { format: 'cjs', bundle: false, dts: false },
  ],
  source: {
    entry: {
      index: ['./src/**', '!src/**/__tests__/**'],
    },
  },
});
