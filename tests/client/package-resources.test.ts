import { describe, expect, it } from 'vitest';
import packageJson from '../../packages/client/package.json';

interface ElectronBuilderConfig {
  appId?: string;
  productName?: string;
  asar?: boolean;
  npmRebuild?: boolean;
  directories?: {
    output?: string;
  };
  files?: string[];
  extraResources?: Array<{ from: string; to: string }>;
  mac?: {
    identity?: string | null;
    target?: string[];
  };
}

const buildConfig = packageJson.build as ElectronBuilderConfig | undefined;

describe('@webgl-editor/client package resources', () => {
  it('packages electron-vite output plus editor and server runtime resources', () => {
    expect(packageJson.scripts['build:resources']).toContain('@webgl-editor/editor');
    expect(packageJson.scripts['build:resources']).toContain('@webgl-editor/server');
    expect(packageJson.scripts.package).toContain('electron-builder');
    expect(packageJson.scripts['package:mac']).toContain('electron-builder --mac');

    expect(buildConfig).toMatchObject({
      appId: 'dev.webgl-editor.client',
      productName: 'WebGL Editor',
      asar: true,
      npmRebuild: false,
      directories: {
        output: 'release'
      },
      files: ['out/**']
    });
    expect(buildConfig?.extraResources).toEqual([
      {
        from: '../../apps/editor/dist',
        to: 'apps/editor/dist'
      },
      {
        from: '../server/dist',
        to: 'server/dist'
      }
    ]);
    expect(buildConfig?.mac).toMatchObject({
      identity: null,
      target: ['dmg', 'zip']
    });
  });
});
