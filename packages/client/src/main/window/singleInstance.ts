import type { App, BrowserWindow } from 'electron';

export type MainWindowAccessor = () => Pick<BrowserWindow, 'focus' | 'isDestroyed' | 'isMinimized' | 'restore'> | undefined;

export type SingleInstanceApp = Pick<App, 'quit' | 'requestSingleInstanceLock'> & {
  on(event: 'second-instance', listener: () => void): void;
};

export function registerSingleInstanceGuard(app: SingleInstanceApp, getMainWindow: MainWindowAccessor): boolean {
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return false;
  }

  app.on('second-instance', () => {
    focusMainWindow(getMainWindow());
  });
  return true;
}

export function focusMainWindow(window: ReturnType<MainWindowAccessor>): void {
  if (!window || window.isDestroyed()) {
    return;
  }

  if (window.isMinimized()) {
    window.restore();
  }
  window.focus();
}
