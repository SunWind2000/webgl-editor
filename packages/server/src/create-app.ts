import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { normalizeServerAppOptions } from './common/server-options';
import type { ServerAppOptions, StartedServerApp } from './common/server.types';

export async function createServerApp(options: ServerAppOptions): Promise<INestApplication> {
  const normalizedOptions = normalizeServerAppOptions(options);
  const app = await NestFactory.create(AppModule.register(normalizedOptions), {
    logger: ['error', 'warn']
  });

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: normalizedOptions.allowedOrigins,
    credentials: false
  });

  return app;
}

export async function startServer(options: ServerAppOptions): Promise<StartedServerApp> {
  const normalizedOptions = normalizeServerAppOptions(options);
  const app = await createServerApp(normalizedOptions);
  await app.listen(normalizedOptions.port, normalizedOptions.host);

  return {
    app,
    host: normalizedOptions.host,
    port: normalizedOptions.port,
    url: `http://${normalizedOptions.host}:${normalizedOptions.port}`
  };
}
