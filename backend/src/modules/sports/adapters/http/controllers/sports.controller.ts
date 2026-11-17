import { Controller, Get, Query } from '@nestjs/common';
import { ApiEndpoint } from '../../../../../common/http/api-endpoint.decorator.js';
import { ResponseContract } from '../../../../../common/http/response-contract.js';
import { SportsApplication } from '../../../application/sports.application.js';
import {
  ArenaSportsQueryDto,
  MaterialPageDto,
  SportMaterialsQueryDto,
  SportPageDto,
  SportsQueryDto,
} from '../dto/sports.dto.js';
@ApiEndpoint('sports')
@Controller('sports')
export class SportsController {
  constructor(private readonly application: SportsApplication) {}
  @Get() @ResponseContract(SportPageDto) list(@Query() query: SportsQueryDto) {
    return this.application.list(query);
  }
  @Get('arena') @ResponseContract(SportPageDto) forArena(
    @Query() query: ArenaSportsQueryDto,
  ) {
    return this.application.forArena(query.arenaId, query);
  }
  @Get('material') @ResponseContract(MaterialPageDto) materials(
    @Query() query: SportMaterialsQueryDto,
  ) {
    return this.application.materials(query.sportId, query);
  }
}
