import { describe, expect, it, vi } from 'vitest';
import {
  isDevToolsShortcutInput,
  registerDevToolsShortcut
} from '../../packages/client/src/main/window/devToolsShortcut';

describe('@webgl-editor/client DevTools shortcut', () => {
  it('recognizes F12 key down as the DevTools shortcut', () => {
    expect(isDevToolsShortcutInput({ type: 'keyDown', key: 'F12' })).toBe(true);
    expect(isDevToolsShortcutInput({ type: 'keyUp', key: 'F12' })).toBe(false);
    expect(isDevToolsShortcutInput({ type: 'keyDown', key: 'f12' })).toBe(false);
  });

  it('opens DevTools in detached mode when F12 is pressed', () => {
    const preventDefault = vi.fn();
    const openDevTools = vi.fn();
    const webContents = createWebContentsMock({
      isDevToolsOpened: () => false,
      openDevTools
    });

    registerDevToolsShortcut(webContents);
    webContents.emitBeforeInput({ preventDefault }, { type: 'keyDown', key: 'F12' });

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(openDevTools).toHaveBeenCalledWith({ mode: 'detach' });
  });

  it('does not reopen DevTools when they are already open', () => {
    const preventDefault = vi.fn();
    const openDevTools = vi.fn();
    const webContents = createWebContentsMock({
      isDevToolsOpened: () => true,
      openDevTools
    });

    registerDevToolsShortcut(webContents);
    webContents.emitBeforeInput({ preventDefault }, { type: 'keyDown', key: 'F12' });

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(openDevTools).not.toHaveBeenCalled();
  });
});

interface WebContentsMockOptions {
  isDevToolsOpened: () => boolean;
  openDevTools: (options: { mode: 'detach' }) => void;
}

function createWebContentsMock(options: WebContentsMockOptions) {
  let beforeInputListener: ((event: { preventDefault: () => void }, input: { type: string; key: string }) => void) | undefined;

  return {
    on: vi.fn((channel: string, listener: typeof beforeInputListener) => {
      if (channel === 'before-input-event') {
        beforeInputListener = listener;
      }
    }),
    isDevToolsOpened: options.isDevToolsOpened,
    openDevTools: options.openDevTools,
    emitBeforeInput(event: { preventDefault: () => void }, input: { type: string; key: string }) {
      beforeInputListener?.(event, input);
    }
  };
}
