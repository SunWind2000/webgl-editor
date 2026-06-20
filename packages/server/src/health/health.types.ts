export interface HealthResponse {
  readonly status: 'ok';
  readonly service: '@webgl-editor/server';
  readonly version: string;
  readonly startedAtMs: number;
  readonly uptimeMs: number;
  readonly sqlite: {
    readonly injected: boolean;
    readonly databasePath: string;
  };
}
