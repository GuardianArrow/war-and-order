// apps/bot/vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.spec.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules/**', 'dist/**'],
    // enable if you want coverage later
    coverage: { enabled: false }
  },
  resolve: {
    alias: {
      // If you’d like a shortcut import like `@/utils/...`, uncomment:
      // '@': path.resolve(__dirname, 'src'),
    }
  }
});