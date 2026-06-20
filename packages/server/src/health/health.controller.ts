import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import type { HealthResponse } from './health.types';

const startedAtMs = Date.now();

@Controller()
export class HealthController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('health')
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: '@webgl-editor/server',
      version: '0.1.0',
      startedAtMs,
      uptimeMs: Date.now() - startedAtMs,
      sqlite: {
        injected: this.databaseService.isInjected(),
        databasePath: this.databaseService.getDatabasePath()
      }
    };
  }
}
