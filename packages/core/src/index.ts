export const WEBGL_EDITOR_CORE_VERSION = '0.1.0';

export interface CoreRuntimeInfo {
  readonly packageName: '@webgl-editor/core';
  readonly version: string;
}

export function getCoreRuntimeInfo(): CoreRuntimeInfo {
  return {
    packageName: '@webgl-editor/core',
    version: WEBGL_EDITOR_CORE_VERSION
  };
}
