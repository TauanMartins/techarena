import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiEndpoint } from '../../../../common/http/api-endpoint.decorator.js';
import { ResponseContract } from '../../../../common/http/response-contract.js';
import { PaginationQueryDto } from '../../../../common/http/pagination.dto.js';
import { CurrentUser } from '../../../auth/adapters/http/auth.decorators.js';
import type { AuthenticatedUser } from '../../../auth/domain/access-token-verifier.port.js';
import { FriendsApplication } from '../../application/friends.application.js';
import {
  CreateFriendDto,
  FriendDto,
  FriendGroupsDto,
  UpdateFriendDto,
} from './friends.dto.js';
@ApiEndpoint('friends')
@Controller('friend')
export class FriendsController {
  constructor(private readonly app: FriendsApplication) {}
  @Get() @ResponseContract(FriendGroupsDto) list(
    @CurrentUser() a: AuthenticatedUser,
    @Query() q: PaginationQueryDto,
  ) {
    return this.app.list(a.id, q);
  }
  @Post() @HttpCode(200) @ResponseContract(FriendDto) create(
    @CurrentUser() a: AuthenticatedUser,
    @Body() b: CreateFriendDto,
  ) {
    return this.app.request(a.id, b.userId);
  }
  @Put() @ResponseContract(FriendDto) update(
    @CurrentUser() a: AuthenticatedUser,
    @Body() b: UpdateFriendDto,
  ) {
    return this.app.decide(a.id, b.friendId, b.action);
  }
}
