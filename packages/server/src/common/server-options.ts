import { resolve } from 'node:path';
import type { NormalizedServerAppOptions, ServerAppOptions } from './server.types';

export const SERVER_APP_OPTIONS = Symbol('SERVER_APP_OPTIONS');

export function normalizeServerAppOptions(options: ServerAppOptions): NormalizedServerAppOptions {
  const port = options.port ?? 4175;
  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error(`invalid server port "${port}"`);
  }

  return {
    host: options.host ?? '127.0.0.1',
    port,
    databasePath: resolve(options.databasePath),
    sessionSecret: options.sessionSecret,
    allowedOrigins: options.allowedOrigins ?? ['http://127.0.0.1:5174', 'http://localhost:5174']
  };
}
