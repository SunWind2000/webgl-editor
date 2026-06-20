export interface BuildLocalServerEnvironmentOptions {
  readonly allowedOrigins?: string;
  readonly baseEnv?: NodeJS.ProcessEnv;
  readonly databasePath: string;
  readonly packaged: boolean;
  readonly serverPort: number;
  readonly sessionSecret: string;
}

export function buildLocalServerEnvironment(options: BuildLocalServerEnvironmentOptions): NodeJS.ProcessEnv {
  return {
    ...(options.baseEnv ?? process.env),
    WEBGL_EDITOR_SERVER_HOST: '127.0.0.1',
    WEBGL_EDITOR_SERVER_PORT: String(options.serverPort),
    WEBGL_EDITOR_DATABASE_PATH: options.databasePath,
    WEBGL_EDITOR_SESSION_SECRET: options.sessionSecret,
    ...(options.allowedOrigins ? { WEBGL_EDITOR_ALLOWED_ORIGINS: options.allowedOrigins } : {}),
    ...(options.packaged ? { ELECTRON_RUN_AS_NODE: '1' } : {})
  };
}
