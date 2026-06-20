export const WEBGL_EDITOR_CLIENT_VERSION = '0.1.0';

export interface WebglEditorRuntimeConfig {
  readonly serverBaseUrl: string;
  readonly sessionSecret?: string;
}
