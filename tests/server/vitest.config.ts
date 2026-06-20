import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@webgl-editor/server': fileURLToPath(new URL('../../packages/server/src/index.ts', import.meta.url))
    }
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts']
  }
});
