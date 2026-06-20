import { readdir } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';
import { describe, expect, it } from 'vitest';

const serverSourceRoot = fileURLToPath(new URL('../../packages/server/src/', import.meta.url));

describe('@webgl-editor/server source layout', () => {
  it('keeps controllers and services inside feature directories', async () => {
    const rootEntries = await readdir(serverSourceRoot);

    expect(rootEntries).not.toContain('capabilities.controller.ts');
    expect(rootEntries).not.toContain('database.service.ts');
    expect(rootEntries).not.toContain('events.controller.ts');
    expect(rootEntries).not.toContain('health.controller.ts');
    expect(rootEntries).toEqual(expect.arrayContaining([
      'capabilities',
      'common',
      'database',
      'events',
      'health'
    ]));
  });
});
