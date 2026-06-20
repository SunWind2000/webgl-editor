import { join } from 'node:path';
import {
  allocateLocalPort,
  registerShutdownHandlers,
  resolvePreferredPort,
  run,
  shutdown,
  start,
  waitForURL,
  workspaceRoot
} from './dev-shared.ts';

registerShutdownHandlers();

const editorPort = await allocateLocalPort(
  resolvePreferredPort(process.env.WEBGL_EDITOR_APP_PORT ?? process.env.VITE_PORT, 5174)
);
const editorUrl = `http://127.0.0.1:${editorPort}`;

console.log('[webgl-editor:dev] building server and client');
await run('pnpm', ['--dir', workspaceRoot, '--filter', '@webgl-editor/server', 'build']);
await run('pnpm', ['--dir', workspaceRoot, '--filter', '@webgl-editor/client', 'build']);

console.log('[webgl-editor:dev] starting editor');
start(
  'pnpm',
  ['--dir', join(workspaceRoot, 'apps/editor'), 'exec', 'vite', '--host', '127.0.0.1', '--port', String(editorPort), '--strictPort'],
  {},
  {
    label: 'editor',
    onUnexpectedExit: (code) => shutdown(code)
  }
);
await waitForURL(editorUrl, 'editor');

console.log('[webgl-editor:dev] starting electron client');
start(
  'pnpm',
  ['--dir', join(workspaceRoot, 'packages/client'), 'exec', 'electron', '.'],
  {
    WEBGL_EDITOR_URL: editorUrl,
    WEBGL_EDITOR_SERVER_ENTRY: join(workspaceRoot, 'packages/server/dist/main.js')
  },
  {
    label: 'electron client',
    onUnexpectedExit: (code) => shutdown(code)
  }
);

console.log('');
console.log('[webgl-editor:dev] ready');
console.log(`  electron editor: ${editorUrl}`);
console.log('  stop: Ctrl+C');
