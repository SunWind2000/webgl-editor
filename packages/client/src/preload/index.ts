import { contextBridge, ipcRenderer } from 'electron';
import type { WebglEditorRuntimeConfig } from '../index.js';

export interface WebglEditorBridge {
  getRuntimeConfig: () => Promise<WebglEditorRuntimeConfig>;
  openFileDialog: () => Promise<string[]>;
  revealInFolder: (path: string) => Promise<void>;
}

const bridge: WebglEditorBridge = {
  getRuntimeConfig: () => ipcRenderer.invoke('webgl-editor:get-runtime-config') as Promise<WebglEditorRuntimeConfig>,
  openFileDialog: () => ipcRenderer.invoke('webgl-editor:open-file-dialog') as Promise<string[]>,
  revealInFolder: (path: string) => ipcRenderer.invoke('webgl-editor:reveal-in-folder', path) as Promise<void>
};

contextBridge.exposeInMainWorld('webglEditor', bridge);
