import { join, resolve } from 'node:path';

export interface RuntimePathContext {
  readonly appPath: string;
  readonly dirname: string;
  readonly isPackaged: boolean;
  readonly resourcesPath: string;
}

export interface RuntimePaths {
  readonly preload: string;
  readonly editorIndex: string;
  readonly serverEntry: string;
}

export function resolveRuntimePaths(context: RuntimePathContext): RuntimePaths {
  const root = context.isPackaged
    ? context.resourcesPath
    : resolve(context.appPath, '../..');

  return {
    preload: join(context.dirname, '../preload/index.cjs'),
    editorIndex: join(root, 'apps/editor/dist/index.html'),
    serverEntry: join(root, context.isPackaged ? 'server/dist/main.js' : 'packages/server/dist/main.js')
  };
}
