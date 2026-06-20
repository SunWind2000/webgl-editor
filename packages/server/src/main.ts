import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { startServer } from './create-app';
export { createServerApp, startServer } from './create-app';
export type { CapabilitiesResponse } from './capabilities/capabilities.types';
export type { HealthResponse } from './health/health.types';
export type {
  ServerAppOptions,
  StartedServerApp
} from './common/server.types';

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;

if (isMain) {
  const databasePath = resolve(
    process.env.WEBGL_EDITOR_DATABASE_PATH ??
      process.env.DATABASE_PATH ??
      '.tmp/editor-server/project.db'
  );
  mkdirSync(dirname(databasePath), { recursive: true });

  const host = process.env.WEBGL_EDITOR_SERVER_HOST ?? '127.0.0.1';
  const port = parsePort(process.env.WEBGL_EDITOR_SERVER_PORT ?? process.env.PORT, 4175);
  const sessionSecret = process.env.WEBGL_EDITOR_SESSION_SECRET ?? randomUUID();

  const started = await startServer({
    host,
    port,
    databasePath,
    sessionSecret,
    allowedOrigins: parseAllowedOrigins(process.env.WEBGL_EDITOR_ALLOWED_ORIGINS)
  });

  console.log(`[webgl-editor/server] listening ${started.url}`);
  console.log(`[webgl-editor/server] database ${databasePath}`);
}

function parsePort(value: string | undefined, fallback: number): number {
  const port = Number(value ?? fallback);
  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error(`invalid WEBGL_EDITOR_SERVER_PORT "${value}"`);
  }
  return port;
}

function parseAllowedOrigins(value: string | undefined): string[] {
  if (!value) {
    return ['http://127.0.0.1:5174', 'http://localhost:5174'];
  }
  return value.split(',').map((origin) => origin.trim()).filter(Boolean);
}

export const serverEntryPath = fileURLToPath(import.meta.url);
