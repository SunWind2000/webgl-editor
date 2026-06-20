export interface RuntimeConfig {
  readonly serverBaseUrl: string;
  readonly sessionSecret?: string;
}

export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  if (window.webglEditor) {
    return window.webglEditor.getRuntimeConfig();
  }

  return {
    serverBaseUrl: import.meta.env.VITE_WEBGL_EDITOR_SERVER_BASE_URL ?? 'http://127.0.0.1:4175',
    sessionSecret: import.meta.env.VITE_WEBGL_EDITOR_SESSION_SECRET
  };
}
