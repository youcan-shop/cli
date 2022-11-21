import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5540,
  },
  test: {
    testTimeout: 55000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'lib'),
    },
  },
});
