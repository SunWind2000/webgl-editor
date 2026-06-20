import { DynamicModule, Module } from '@nestjs/common';
import { CapabilitiesController } from './capabilities/capabilities.controller';
import { SERVER_APP_OPTIONS, normalizeServerAppOptions } from './common/server-options';
import type { ServerAppOptions } from './common/server.types';
import { DatabaseService } from './database/database.service';
import { EventsController } from './events/events.controller';
import { HealthController } from './health/health.controller';

@Module({})
export class AppModule {
  static register(options: ServerAppOptions): DynamicModule {
    return {
      module: AppModule,
      controllers: [
        CapabilitiesController,
        EventsController,
        HealthController
      ],
      providers: [
        {
          provide: SERVER_APP_OPTIONS,
          useValue: normalizeServerAppOptions(options)
        },
        DatabaseService
      ]
    };
  }
}
