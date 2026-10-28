import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { Public } from '../modules/auth/adapters/http/auth.decorators.js';
import { ResponseContract } from '../common/http/response-contract.js';
import { HealthResponseDto } from './health-response.dto.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Check PostgreSQL availability and pending migrations',
  })
  @ApiServiceUnavailableResponse({
    description: 'PostgreSQL is unavailable or has pending migrations.',
  })
  @ResponseContract(HealthResponseDto)
  async check(): Promise<HealthResponseDto> {
    try {
      await this.dataSource.query('SELECT 1');
      if (await this.dataSource.showMigrations()) {
        throw new ServiceUnavailableException('Database migrations pending');
      }
    } catch {
      throw new ServiceUnavailableException(
        'Database unavailable or migrations pending',
      );
    }
    return { status: 'ok', database: 'up' };
  }
}
