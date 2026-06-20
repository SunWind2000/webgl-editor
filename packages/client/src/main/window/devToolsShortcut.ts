import type { WebContents } from 'electron';

export type DevToolsShortcutInput = Pick<Electron.Input, 'key' | 'type'>;

export function isDevToolsShortcutInput(input: DevToolsShortcutInput): boolean {
  return input.type === 'keyDown' && input.key === 'F12';
}

export function registerDevToolsShortcut(webContents: Pick<WebContents, 'on' | 'isDevToolsOpened' | 'openDevTools'>): void {
  webContents.on('before-input-event', (event, input) => {
    if (!isDevToolsShortcutInput(input)) {
      return;
    }

    event.preventDefault();
    if (!webContents.isDevToolsOpened()) {
      webContents.openDevTools({ mode: 'detach' });
    }
  });
}
