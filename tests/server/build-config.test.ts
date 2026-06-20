import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { describe, expect, it } from 'vitest';
import config from '../../packages/server/vite.config';

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url));
const serverRoot = join(workspaceRoot, 'packages/server');
const serverSourceRoot = join(serverRoot, 'src');

interface ViteSsrBuildConfig {
  ssr?: {
    noExternal?: unknown[];
  };
  build?: {
    ssr?: boolean;
    target?: string;
    outDir?: string;
    lib?: {
      entry?: string;
      formats?: string[];
      fileName?: string;
    };
  };
}

const viteConfig = config as ViteSsrBuildConfig;

describe('@webgl-editor/server Vite SSR build', () => {
  it('uses the fs-markdown-style Vite SSR bundle entry', async () => {
    const packageJson = JSON.parse(await readFile(join(serverRoot, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.build).toContain('vite build');
    expect(viteConfig.build).toMatchObject({
      ssr: true,
      target: 'node22',
      outDir: 'dist',
      lib: {
        entry: 'src/main.ts',
        formats: ['es'],
        fileName: 'main'
      }
    });
    expect(viteConfig.ssr?.noExternal).toEqual(expect.arrayContaining([
      /^@nestjs\//,
      'reflect-metadata',
      'rxjs'
    ]));
  });

  it('keeps server source imports in bundler style without .js suffixes', async () => {
    const sourceFiles = await listTypeScriptFiles(serverSourceRoot);
    const sources = await Promise.all(sourceFiles.map((path) => readFile(path, 'utf8')));
    const sourceText = sources.join('\n');

    expect(sourceText).not.toMatch(/from ['"]\.[^'"]+\.js['"]/);
  });
});

async function listTypeScriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return listTypeScriptFiles(entryPath);
    }
    return entry.name.endsWith('.ts') ? [entryPath] : [];
  }));
  return nested.flat();
}
