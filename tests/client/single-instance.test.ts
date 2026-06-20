import { describe, expect, it, vi } from 'vitest';
import {
  focusMainWindow,
  registerSingleInstanceGuard,
  type SingleInstanceApp
} from '../../packages/client/src/main/window/singleInstance';

describe('@webgl-editor/client single instance guard', () => {
  it('quits duplicate app instances before they can create windows', () => {
    const app = createAppMock(false);

    expect(registerSingleInstanceGuard(app, () => undefined)).toBe(false);
    expect(app.quit).toHaveBeenCalledOnce();
    expect(app.on).not.toHaveBeenCalled();
  });

  it('focuses the existing window for second-instance launches', () => {
    const app = createAppMock(true);
    const window = createWindowMock({ minimized: true });

    expect(registerSingleInstanceGuard(app, () => window)).toBe(true);
    app.emitSecondInstance();

    expect(window.restore).toHaveBeenCalledOnce();
    expect(window.focus).toHaveBeenCalledOnce();
  });

  it('ignores missing or destroyed windows during second-instance handling', () => {
    const destroyedWindow = createWindowMock({ destroyed: true });

    focusMainWindow(undefined);
    focusMainWindow(destroyedWindow);

    expect(destroyedWindow.restore).not.toHaveBeenCalled();
    expect(destroyedWindow.focus).not.toHaveBeenCalled();
  });
});

function createAppMock(lockAcquired: boolean): SingleInstanceApp & { emitSecondInstance(): void } {
  let secondInstanceListener: (() => void) | undefined;

  return {
    requestSingleInstanceLock: vi.fn(() => lockAcquired),
    quit: vi.fn(),
    on: vi.fn((event: 'second-instance', listener: () => void) => {
      if (event === 'second-instance') {
        secondInstanceListener = listener;
      }
    }),
    emitSecondInstance() {
      secondInstanceListener?.();
    }
  };
}

function createWindowMock(options: { destroyed?: boolean; minimized?: boolean }) {
  return {
    isDestroyed: vi.fn(() => options.destroyed ?? false),
    isMinimized: vi.fn(() => options.minimized ?? false),
    restore: vi.fn(),
    focus: vi.fn()
  };
}
