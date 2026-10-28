import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Return the default greeting' })
  @ApiResponse({ status: 200, description: 'The greeting was returned.' })
  getHello(): string {
    return this.appService.getHello();
  }
}
