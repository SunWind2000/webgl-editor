import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@webgl-editor/ui': fileURLToPath(new URL('../../packages/ui/src/index.ts', import.meta.url))
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['**/*.test.ts']
  }
});
