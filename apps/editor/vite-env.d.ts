/// <reference types="vite/client" />

import type { RuntimeConfig } from './src/runtime';

declare global {
  interface Window {
    webglEditor?: {
      getRuntimeConfig: () => Promise<RuntimeConfig>;
      openFileDialog: () => Promise<string[]>;
      revealInFolder: (path: string) => Promise<void>;
    };
  }
}
