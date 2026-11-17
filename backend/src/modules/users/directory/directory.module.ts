import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DirectoryController } from './adapters/http/controllers/directory.controller.js';
import { TypeormDirectoryRepository } from './adapters/persistence/typeorm-directory.repository.js';
import type { DirectoryRepository } from './application/ports/directory-repository.port.js';
import { DIRECTORY_REPOSITORY } from './application/ports/directory-repository.port.js';
import { DirectoryApplication } from './application/directory.application.js';
@Module({
  imports: [],
  controllers: [DirectoryController],
  providers: [
    {
      provide: DIRECTORY_REPOSITORY,
      inject: [DataSource],
      useFactory: (source: DataSource) =>
        new TypeormDirectoryRepository(source),
    },
    {
      provide: DirectoryApplication,
      inject: [DIRECTORY_REPOSITORY],
      useFactory: (repository: DirectoryRepository) =>
        new DirectoryApplication(repository),
    },
  ],
  exports: [],
})
export class DirectoryModule {}
