import { describe, expect, it } from 'vitest';
import config from '../../packages/client/electron.vite.config';

interface ElectronViteTestConfig {
  main?: ElectronViteBuildConfig;
  preload?: ElectronViteBuildConfig;
}

interface ElectronViteBuildConfig {
  build?: {
    rollupOptions?: {
      input?: string;
      external?: unknown;
      output?: {
        format?: string;
        entryFileNames?: string;
      };
    };
  };
}

const electronViteConfig = config as ElectronViteTestConfig;

function getExternalEntries(target: 'main' | 'preload'): unknown[] {
  const external = electronViteConfig[target]?.build?.rollupOptions?.external;

  if (Array.isArray(external)) {
    return external;
  }

  if (external === undefined) {
    return [];
  }

  return [external];
}

describe('@webgl-editor/client electron-vite config', () => {
  it('uses fs-markdown-style main and preload source directories', () => {
    expect(electronViteConfig.main?.build?.rollupOptions?.input).toContain('src/main/index.ts');
    expect(electronViteConfig.preload?.build?.rollupOptions?.input).toContain('src/preload/index.ts');
  });

  it('keeps Electron runtime imports external in main and preload bundles', () => {
    expect(getExternalEntries('main')).toContain('electron');
    expect(getExternalEntries('preload')).toContain('electron');
  });

  it('emits the TypeScript preload entry as a CommonJS bundle for Electron', () => {
    expect(electronViteConfig.preload?.build?.rollupOptions?.output).toMatchObject({
      format: 'cjs',
      entryFileNames: '[name].cjs'
    });
  });
});
