import { app, type BrowserWindow } from 'electron';
import type { WebglEditorRuntimeConfig } from '../index.js';
import { registerIpcHandlers } from './ipc/registerIpcHandlers.js';
import { prepareRuntimeConfig, stopLocalServer } from './server/localServer.js';
import { createMainWindow } from './window/createMainWindow.js';
import { registerSingleInstanceGuard } from './window/singleInstance.js';

let mainWindow: BrowserWindow | undefined;
let runtimeConfig: WebglEditorRuntimeConfig | undefined;

if (registerSingleInstanceGuard(app, () => mainWindow)) {
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('before-quit', () => {
    stopLocalServer();
  });

  app.whenReady().then(async () => {
    runtimeConfig = await prepareRuntimeConfig();
    registerIpcHandlers(() => runtimeConfig);
    await openMainWindow();
  });

  app.on('activate', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      void openMainWindow();
    }
  });
}

async function openMainWindow(): Promise<void> {
  if (!runtimeConfig) {
    runtimeConfig = await prepareRuntimeConfig();
  }
  mainWindow = await createMainWindow(runtimeConfig);
}
