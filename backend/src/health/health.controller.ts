import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { ResponseContract } from '../common/http/response-contract.js';
import { APPLICATION_VERSION } from '../config/application-version.js';
import { Public } from '../modules/auth/adapters/http/auth.decorators.js';
import { HealthResponseDto } from './health-response.dto.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Verifica a disponibilidade do PostgreSQL e migrações pendentes',
  })
  @ApiServiceUnavailableResponse({
    description: 'PostgreSQL indisponível ou com migrações pendentes.',
  })
  @ResponseContract(HealthResponseDto)
  async check(): Promise<HealthResponseDto> {
    try {
      await this.dataSource.query('SELECT 1');
      if (await this.dataSource.showMigrations()) {
        throw new ServiceUnavailableException(
          'O banco de dados ainda possui migrações pendentes.',
        );
      }
    } catch {
      throw new ServiceUnavailableException(
        'O banco de dados está indisponível ou possui migrações pendentes.',
      );
    }
    return { status: 'ok', database: 'up', version: APPLICATION_VERSION };
  }
}
