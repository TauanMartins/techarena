import { Catch } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { UserError } from '../../domain/user.js';

@Catch(UserError)
export class UserErrorFilter implements ExceptionFilter<UserError> {
  catch(error: UserError, host: ArgumentsHost) {
    const status = { invalid: 400, not_found: 404, conflict: 409 }[error.kind];
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(status)
      .json({ statusCode: status, code: error.code, message: error.message });
  }
}
