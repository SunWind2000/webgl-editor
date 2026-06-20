import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  ssr: {
    noExternal: [
      /^@nestjs\//,
      'reflect-metadata',
      'rxjs'
    ]
  },
  build: {
    ssr: true,
    target: 'node22',
    outDir: 'dist',
    lib: {
      entry: 'src/main.ts',
      formats: ['es'],
      fileName: 'main'
    }
  }
});
