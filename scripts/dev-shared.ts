import { spawn, type ChildProcess } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsRoot = dirname(fileURLToPath(import.meta.url));
export const workspaceRoot = resolve(scriptsRoot, '..');

type DevScriptEnv = Record<string, string | undefined>;

interface RunOptions {
  cwd?: string;
  stdio?: 'inherit' | 'pipe' | 'ignore';
}

interface StartOptions extends RunOptions {
  label?: string;
  onUnexpectedExit?: (code: number, signal: NodeJS.Signals | null) => void;
}

const children = new Set<ChildProcess>();
let shuttingDown = false;

export function registerShutdownHandlers(): void {
  process.once('SIGINT', () => shutdown(130));
  process.once('SIGTERM', () => shutdown(143));
  process.once('exit', () => stopChildren());
}

export function shutdown(code = 0): never {
  stopChildren();
  process.exit(code);
}

export function stopChildren(signal: NodeJS.Signals = 'SIGTERM'): void {
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

export async function run(
  command: string,
  args: string[],
  env: DevScriptEnv = {},
  options: RunOptions = {}
): Promise<void> {
  return new Promise((resolveRun, reject) => {
    const child = spawnChild(command, args, env, options);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolveRun();
      } else {
        reject(new Error(`${command} ${args.join(' ')} failed: code=${code ?? 'null'} signal=${signal ?? 'null'}`));
      }
    });
    child.once('error', reject);
  });
}

export function start(
  command: string,
  args: string[],
  env: DevScriptEnv = {},
  options: StartOptions = {}
): ChildProcess {
  const child = spawnChild(command, args, env, options);
  child.once('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }
    if (code !== 0 && signal !== 'SIGTERM' && signal !== 'SIGINT') {
      const label = options.label ?? `${command} ${args.join(' ')}`;
      console.error(`[webgl-editor:dev] ${label} exited: code=${code ?? 'null'} signal=${signal ?? 'null'}`);
      options.onUnexpectedExit?.(code ?? 1, signal);
    }
  });
  return child;
}

export async function allocateLocalPort(preferredPort = 0): Promise<number> {
  if (preferredPort > 0) {
    const preferred = await tryAllocateLocalPort(preferredPort);
    if (preferred) {
      return preferred;
    }
  }

  const allocated = await tryAllocateLocalPort(0);
  if (!allocated) {
    throw new Error('no available local port found');
  }
  return allocated;
}

export function resolvePreferredPort(value: string | undefined, fallback: number): number {
  const port = Number(value ?? fallback);
  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error(`invalid preferred port "${value ?? fallback}"`);
  }
  return port;
}

export async function prepareDevDatabasePath(name: string): Promise<string> {
  const directory = resolve(workspaceRoot, '.tmp', name);
  await mkdir(directory, { recursive: true });
  return join(directory, 'project.db');
}

export async function waitForURL(url: string, label: string): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Retry while the process starts.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`${label} did not become ready at ${url}`);
}

function spawnChild(
  command: string,
  args: string[],
  env: DevScriptEnv = {},
  options: RunOptions = {}
): ChildProcess {
  const child = spawn(command, args, {
    cwd: options.cwd ?? workspaceRoot,
    env: { ...process.env, ...env },
    stdio: options.stdio ?? 'inherit'
  });
  children.add(child);
  child.once('exit', () => children.delete(child));
  return child;
}

function tryAllocateLocalPort(port: number): Promise<number | undefined> {
  return new Promise((resolveAllocate) => {
    const server = createServer();
    server.unref();
    server.once('error', () => resolveAllocate(undefined));
    server.listen(port, '127.0.0.1', () => {
      const address = server.address();
      const allocatedPort = typeof address === 'object' && address ? address.port : undefined;
      server.close(() => resolveAllocate(allocatedPort));
    });
  });
}
