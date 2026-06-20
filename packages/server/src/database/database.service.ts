import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SERVER_APP_OPTIONS } from '../common/server-options';
import type { NormalizedServerAppOptions } from '../common/server.types';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private database?: DatabaseSync;

  constructor(
    @Inject(SERVER_APP_OPTIONS)
    private readonly options: NormalizedServerAppOptions
  ) {}

  onModuleInit(): void {
    mkdirSync(dirname(this.options.databasePath), { recursive: true });
    this.database = new DatabaseSync(this.options.databasePath);
    this.database.exec(`
      create table if not exists app_metadata (
        key text primary key,
        value text not null,
        updated_at_ms integer not null
      );
    `);
    this.database
      .prepare(`
        insert into app_metadata (key, value, updated_at_ms)
        values ('schema.version', '1', ?)
        on conflict(key) do update set
          value = excluded.value,
          updated_at_ms = excluded.updated_at_ms
      `)
      .run(Date.now());
  }

  onModuleDestroy(): void {
    this.database?.close();
    this.database = undefined;
  }

  isInjected(): boolean {
    return this.options.databasePath.length > 0;
  }

  getDatabasePath(): string {
    return this.options.databasePath;
  }
}
