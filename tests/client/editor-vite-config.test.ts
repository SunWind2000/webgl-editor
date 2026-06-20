import { describe, expect, it } from 'vitest';
import config from '../../apps/editor/vite.config';

describe('@webgl-editor/editor Vite config', () => {
  it('uses a relative base that Vite accepts for packaged file loading', () => {
    expect(config).toMatchObject({
      base: './'
    });
  });
});
