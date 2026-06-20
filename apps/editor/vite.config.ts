import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@webgl-editor/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url))
    }
  }
});
