import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import {
  allocateLocalPort,
  prepareDevDatabasePath,
  registerShutdownHandlers,
  resolvePreferredPort,
  run,
  shutdown,
  start,
  waitForURL,
  workspaceRoot
} from './dev-shared.ts';

registerShutdownHandlers();

const sessionSecret = process.env.WEBGL_EDITOR_SESSION_SECRET ?? randomUUID();
const serverPort = await allocateLocalPort(
  resolvePreferredPort(process.env.WEBGL_EDITOR_SERVER_PORT ?? process.env.PORT, 4175)
);
const editorPort = await allocateLocalPort(
  resolvePreferredPort(process.env.WEBGL_EDITOR_APP_PORT ?? process.env.VITE_PORT, 5174)
);
const serverBaseUrl = `http://127.0.0.1:${serverPort}`;
const editorUrl = `http://127.0.0.1:${editorPort}`;
const databasePath = await prepareDevDatabasePath('editor-dev-web');

console.log('[webgl-editor:dev] building server');
await run('pnpm', ['--dir', workspaceRoot, '--filter', '@webgl-editor/server', 'build']);

console.log('[webgl-editor:dev] starting server');
start(
  process.execPath,
  [join(workspaceRoot, 'packages/server/dist/main.js')],
  {
    WEBGL_EDITOR_SERVER_HOST: '127.0.0.1',
    WEBGL_EDITOR_SERVER_PORT: String(serverPort),
    WEBGL_EDITOR_DATABASE_PATH: databasePath,
    WEBGL_EDITOR_SESSION_SECRET: sessionSecret,
    WEBGL_EDITOR_ALLOWED_ORIGINS: editorUrl
  },
  {
    label: 'server',
    onUnexpectedExit: (code) => shutdown(code)
  }
);
await waitForURL(`${serverBaseUrl}/api/v1/health`, 'server');

console.log('[webgl-editor:dev] starting editor');
start(
  'pnpm',
  ['--dir', join(workspaceRoot, 'apps/editor'), 'exec', 'vite', '--host', '127.0.0.1', '--port', String(editorPort), '--strictPort'],
  {
    VITE_WEBGL_EDITOR_SERVER_BASE_URL: serverBaseUrl,
    VITE_WEBGL_EDITOR_SESSION_SECRET: sessionSecret
  },
  {
    label: 'editor',
    onUnexpectedExit: (code) => shutdown(code)
  }
);
await waitForURL(editorUrl, 'editor');

console.log('');
console.log('[webgl-editor:dev] ready');
console.log(`  editor: ${editorUrl}`);
console.log(`  server: ${serverBaseUrl}`);
console.log(`  database: ${databasePath}`);
console.log('  stop: Ctrl+C');
