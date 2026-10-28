import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ResponseContract } from '../../../../../common/http/response-contract.js';

import { DirectoryApplication } from '../../application/directory.application.js';
import { UserEndpoint } from '../../../shared/http/user-endpoint.decorator.js';

import { SearchUsersQueryDto } from './directory-request.dto.js';
import { UserPageDto } from './directory-response.dto.js';
@UserEndpoint('users/directory')
@Controller('users')
export class DirectoryController {
  constructor(private readonly application: DirectoryApplication) {}
  @Get()
  @ApiOperation({
    summary: 'Search user cards without exposing private profile fields',
  })
  @ResponseContract(UserPageDto)
  search(@Query() query: SearchUsersQueryDto) {
    return this.application.search(query);
  }
}
