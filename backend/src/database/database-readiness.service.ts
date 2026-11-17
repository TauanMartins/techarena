import type { OnApplicationBootstrap } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { assertDatabaseReady } from './database-readiness.js';

@Injectable()
export class DatabaseReadinessService implements OnApplicationBootstrap {
  constructor(private readonly source: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    await assertDatabaseReady(this.source);
  }
}
