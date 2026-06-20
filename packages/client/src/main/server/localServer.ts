import { spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { app } from 'electron';
import type { WebglEditorRuntimeConfig } from '../../index.js';
import { resolveRuntimePaths } from '../config/runtimePaths.js';
import { buildLocalServerEnvironment } from './serverEnvironment.js';

let serverProcess: ChildProcess | undefined;

export async function prepareRuntimeConfig(): Promise<WebglEditorRuntimeConfig> {
  const externalServerBaseUrl = process.env.WEBGL_EDITOR_SERVER_BASE_URL;
  const sessionSecret = process.env.WEBGL_EDITOR_SESSION_SECRET ?? randomUUID();

  if (externalServerBaseUrl) {
    return {
      serverBaseUrl: externalServerBaseUrl,
      sessionSecret
    };
  }

  const serverPort = await allocateLocalPort();
  const serverBaseUrl = `http://127.0.0.1:${serverPort}`;
  const databasePath = resolve(
    process.env.WEBGL_EDITOR_DATABASE_PATH ??
      join(app.getPath('userData'), 'project.db')
  );
  mkdirSync(dirname(databasePath), { recursive: true });

  serverProcess = spawn(process.execPath, [resolveServerEntryPath()], {
    env: buildLocalServerEnvironment({
      allowedOrigins: resolveAllowedOrigins(),
      databasePath,
      packaged: app.isPackaged,
      serverPort,
      sessionSecret
    }),
    stdio: 'inherit'
  });

  await waitForURL(`${serverBaseUrl}/api/v1/health`, 'webgl editor server');

  return {
    serverBaseUrl,
    sessionSecret
  };
}

export function stopLocalServer(): void {
  serverProcess?.kill('SIGTERM');
}

function resolveServerEntryPath(): string {
  if (process.env.WEBGL_EDITOR_SERVER_ENTRY) {
    return resolve(process.env.WEBGL_EDITOR_SERVER_ENTRY);
  }

  return resolveRuntimePaths({
    appPath: app.getAppPath(),
    dirname: fileURLToPath(new URL('.', import.meta.url)),
    isPackaged: app.isPackaged,
    resourcesPath: (process as NodeJS.Process & { resourcesPath: string }).resourcesPath
  }).serverEntry;
}

function resolveAllowedOrigins(): string | undefined {
  if (process.env.WEBGL_EDITOR_ALLOWED_ORIGINS) {
    return process.env.WEBGL_EDITOR_ALLOWED_ORIGINS;
  }

  const editorUrl = process.env.WEBGL_EDITOR_URL ?? process.env.VITE_DEV_SERVER_URL;
  if (!editorUrl) {
    return undefined;
  }

  return new URL(editorUrl).origin;
}

function allocateLocalPort(): Promise<number> {
  return new Promise((resolveAllocate, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : undefined;
      server.close(() => {
        if (port) {
          resolveAllocate(port);
        } else {
          reject(new Error('unable to allocate local port'));
        }
      });
    });
  });
}

async function waitForURL(url: string, label: string): Promise<void> {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Retry while the child process starts.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`${label} did not become ready at ${url}`);
}
