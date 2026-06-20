import { rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

await Promise.all([
  rm(join(workspaceRoot, 'packages/client/out'), { recursive: true, force: true }),
  rm(join(workspaceRoot, 'packages/client/dist'), { recursive: true, force: true })
]);
