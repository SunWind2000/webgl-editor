import { describe, expect, it } from 'vitest';
import { WEBGL_EDITOR_CORE_VERSION } from '@webgl-editor/core';

describe('@webgl-editor/core public entry', () => {
  it('exports a stable package version placeholder', () => {
    expect(WEBGL_EDITOR_CORE_VERSION).toBe('0.1.0');
  });
});
