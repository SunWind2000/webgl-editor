import { describe, expect, it } from 'vitest';
import { buildLocalServerEnvironment } from '../../packages/client/src/main/server/serverEnvironment';

describe('@webgl-editor/client server environment', () => {
  it('runs the packaged Electron executable as Node when spawning the server', () => {
    expect(buildLocalServerEnvironment({
      baseEnv: {
        PATH: '/usr/bin'
      },
      databasePath: '/user-data/project.db',
      packaged: true,
      serverPort: 49152,
      sessionSecret: 'secret'
    })).toMatchObject({
      PATH: '/usr/bin',
      ELECTRON_RUN_AS_NODE: '1',
      WEBGL_EDITOR_SERVER_HOST: '127.0.0.1',
      WEBGL_EDITOR_SERVER_PORT: '49152',
      WEBGL_EDITOR_DATABASE_PATH: '/user-data/project.db',
      WEBGL_EDITOR_SESSION_SECRET: 'secret'
    });
  });

  it('does not force Electron node mode for dev server startup', () => {
    expect(buildLocalServerEnvironment({
      baseEnv: {},
      databasePath: '/repo/.tmp/project.db',
      packaged: false,
      serverPort: 49153,
      sessionSecret: 'secret',
      allowedOrigins: 'http://127.0.0.1:5174'
    })).toEqual({
      WEBGL_EDITOR_SERVER_HOST: '127.0.0.1',
      WEBGL_EDITOR_SERVER_PORT: '49153',
      WEBGL_EDITOR_DATABASE_PATH: '/repo/.tmp/project.db',
      WEBGL_EDITOR_SESSION_SECRET: 'secret',
      WEBGL_EDITOR_ALLOWED_ORIGINS: 'http://127.0.0.1:5174'
    });
  });
});
