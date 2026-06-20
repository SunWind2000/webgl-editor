import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { createServerApp } from '@webgl-editor/server';

const openApps: Array<{ close: () => Promise<void> }> = [];

describe('@webgl-editor/server thin API', () => {
  afterEach(async () => {
    while (openApps.length > 0) {
      await openApps.pop()?.close();
    }
  });

  it('initializes an injected SQLite database and exposes health', async () => {
    const databasePath = await createTempDatabasePath();
    const app = await createServerApp({
      databasePath,
      sessionSecret: 'test-secret'
    });
    openApps.push(app);

    await app.listen(0, '127.0.0.1');
    const baseUrl = getBaseUrl(app);

    const response = await fetch(`${baseUrl}/api/v1/health`);
    expect(response.ok).toBe(true);
    const body = await response.json() as {
      status: string;
      sqlite: { injected: boolean };
    };
    expect(body.status).toBe('ok');
    expect(body.sqlite.injected).toBe(true);

    const database = new DatabaseSync(databasePath);
    const table = database
      .prepare("select name from sqlite_master where type = 'table' and name = 'app_metadata'")
      .get() as { name: string } | undefined;
    database.close();
    expect(table?.name).toBe('app_metadata');
  });

  it('reports MVP capabilities without native geometry', async () => {
    const databasePath = await createTempDatabasePath();
    const app = await createServerApp({
      databasePath,
      sessionSecret: 'test-secret'
    });
    openApps.push(app);

    await app.listen(0, '127.0.0.1');
    const response = await fetch(`${getBaseUrl(app)}/api/v1/capabilities`);
    expect(response.ok).toBe(true);
    await expect(response.json()).resolves.toMatchObject({
      nativeGeometry: false,
      sqlite: true,
      sse: true
    });
  });

  it('streams a server.ready event over SSE', async () => {
    const databasePath = await createTempDatabasePath();
    const app = await createServerApp({
      databasePath,
      sessionSecret: 'test-secret'
    });
    openApps.push(app);

    await app.listen(0, '127.0.0.1');
    const abortController = new AbortController();
    const response = await fetch(`${getBaseUrl(app)}/api/v1/events`, {
      headers: { accept: 'text/event-stream' },
      signal: abortController.signal
    });
    expect(response.ok).toBe(true);
    expect(response.headers.get('content-type')).toContain('text/event-stream');

    const reader = response.body?.getReader();
    expect(reader).toBeDefined();
    const readResult = await reader!.read();
    abortController.abort();
    const chunk = new TextDecoder().decode(readResult.value);
    expect(chunk).toContain('event: server.ready');
  });
});

async function createTempDatabasePath(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'webgl-editor-server-'));
  return join(directory, 'project.db');
}

function getBaseUrl(app: { getHttpServer: () => { address: () => unknown } }): string {
  const address = app.getHttpServer().address();
  if (!address || typeof address !== 'object' || !('port' in address)) {
    throw new Error('server address is not available');
  }
  return `http://127.0.0.1:${address.port}`;
}
