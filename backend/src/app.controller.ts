import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GreetingResponseDto } from './dto/greeting-response.dto.js';
import { AppService } from './app.service.js';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Return the default greeting' })
  @ApiOkResponse({
    type: GreetingResponseDto,
    description: 'The greeting was returned.',
  })
  getHello(): GreetingResponseDto {
    return { message: this.appService.getHello() };
  }
}
