import type { INestApplication } from '@nestjs/common';

export interface ServerAppOptions {
  readonly host?: string;
  readonly port?: number;
  readonly databasePath: string;
  readonly sessionSecret?: string;
  readonly allowedOrigins?: string[];
}

export interface NormalizedServerAppOptions {
  readonly host: string;
  readonly port: number;
  readonly databasePath: string;
  readonly sessionSecret?: string;
  readonly allowedOrigins: string[];
}

export interface StartedServerApp {
  readonly app: INestApplication;
  readonly host: string;
  readonly port: number;
  readonly url: string;
}
