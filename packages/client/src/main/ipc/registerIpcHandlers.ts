import { dialog, ipcMain, shell } from 'electron';
import type { WebglEditorRuntimeConfig } from '../../index.js';

export function registerIpcHandlers(getRuntimeConfig: () => WebglEditorRuntimeConfig | undefined): void {
  ipcMain.handle('webgl-editor:get-runtime-config', () => getRuntimeConfig());
  ipcMain.handle('webgl-editor:open-file-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile']
    });
    return result.canceled ? [] : result.filePaths;
  });
  ipcMain.handle('webgl-editor:reveal-in-folder', async (_event, path: string) => {
    shell.showItemInFolder(path);
  });
}
