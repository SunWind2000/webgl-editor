import { describe, expect, it } from 'vitest';
import { resolveRuntimePaths } from '../../packages/client/src/main/config/runtimePaths';

describe('@webgl-editor/client runtime paths', () => {
  it('loads electron-vite preload output relative to the main bundle', () => {
    expect(resolveRuntimePaths({
      appPath: '/repo/webgl-editor/packages/client',
      dirname: '/repo/webgl-editor/packages/client/out/main',
      isPackaged: false,
      resourcesPath: '/Applications/WebGL Editor.app/Contents/Resources'
    }).preload).toBe('/repo/webgl-editor/packages/client/out/preload/index.cjs');
  });

  it('loads editor and server resources from workspace paths in dev mode', () => {
    expect(resolveRuntimePaths({
      appPath: '/repo/webgl-editor/packages/client',
      dirname: '/repo/webgl-editor/packages/client/out/main',
      isPackaged: false,
      resourcesPath: '/Applications/WebGL Editor.app/Contents/Resources'
    })).toMatchObject({
      editorIndex: '/repo/webgl-editor/apps/editor/dist/index.html',
      serverEntry: '/repo/webgl-editor/packages/server/dist/main.js'
    });
  });

  it('loads editor and server resources from process resources in packaged mode', () => {
    expect(resolveRuntimePaths({
      appPath: '/Applications/WebGL Editor.app/Contents/Resources/app.asar',
      dirname: '/Applications/WebGL Editor.app/Contents/Resources/app.asar/out/main',
      isPackaged: true,
      resourcesPath: '/Applications/WebGL Editor.app/Contents/Resources'
    })).toMatchObject({
      editorIndex: '/Applications/WebGL Editor.app/Contents/Resources/apps/editor/dist/index.html',
      serverEntry: '/Applications/WebGL Editor.app/Contents/Resources/server/dist/main.js'
    });
  });
});
