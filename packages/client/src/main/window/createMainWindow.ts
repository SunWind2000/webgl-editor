import { fileURLToPath } from 'node:url';
import { app, BrowserWindow } from 'electron';
import type { WebglEditorRuntimeConfig } from '../../index.js';
import { resolveRuntimePaths } from '../config/runtimePaths.js';
import { registerDevToolsShortcut } from './devToolsShortcut.js';

export async function createMainWindow(config: WebglEditorRuntimeConfig): Promise<BrowserWindow> {
  const runtimePaths = resolveRuntimePaths({
    appPath: app.getAppPath(),
    dirname: fileURLToPath(new URL('.', import.meta.url)),
    isPackaged: app.isPackaged,
    resourcesPath: (process as NodeJS.Process & { resourcesPath: string }).resourcesPath
  });
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: runtimePaths.preload
    }
  });
  registerDevToolsShortcut(window.webContents);

  window.webContents.once('did-finish-load', () => {
    window.webContents.send('webgl-editor:runtime-ready', config);
    if (process.env.WEBGL_EDITOR_SMOKE_TEST === '1') {
      void runRendererSmokeCheck(window, config);
    }
  });

  const editorUrl = process.env.WEBGL_EDITOR_URL ?? process.env.VITE_DEV_SERVER_URL;
  if (editorUrl) {
    await window.loadURL(editorUrl);
  } else {
    await window.loadFile(runtimePaths.editorIndex);
  }

  return window;
}

async function runRendererSmokeCheck(
  window: BrowserWindow,
  expectedConfig: WebglEditorRuntimeConfig
): Promise<void> {
  try {
    const result = await window.webContents.executeJavaScript(`
      (async () => {
        const runtimeConfig = await window.webglEditor.getRuntimeConfig();
        const response = await fetch(runtimeConfig.serverBaseUrl + '/api/v1/health');
        return {
          runtimeConfig,
          health: await response.json()
        };
      })()
    `) as { runtimeConfig: WebglEditorRuntimeConfig; health: { status?: string } } | undefined;

    if (!result || result.runtimeConfig.serverBaseUrl !== expectedConfig.serverBaseUrl || result.health.status !== 'ok') {
      throw new Error(`renderer smoke check failed: ${JSON.stringify(result)}`);
    }

    console.log(`[webgl-editor:smoke] renderer runtime ok ${result.runtimeConfig.serverBaseUrl}`);
    app.quit();
  } catch (error) {
    console.error(error);
    app.exit(1);
  }
}
