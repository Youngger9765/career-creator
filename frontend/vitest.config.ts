/// <reference types="vitest" />
import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    exclude: [...configDefaults.exclude, 'e2e/*'],
    testTimeout: 10000, // 10 seconds instead of default
    hookTimeout: 10000,
    teardownTimeout: 3000,
    pool: 'forks', // Isolate tests better
    maxConcurrency: 3, // Limit concurrent tests to reduce timeout
    logHeapUsage: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
