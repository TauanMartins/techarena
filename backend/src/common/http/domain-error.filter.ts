import { Catch, HttpException, Logger } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '../domain/domain-error.js';
import {
  errorMessageForStatus,
  translateErrorMessage,
} from './error-messages.js';

@Catch()
export class DomainErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainErrorFilter.name);

  catch(error: unknown, host: ArgumentsHost) {
    let status: number;
    let body: { statusCode: number; code?: string; message: string };

    if (error instanceof DomainError) {
      status = {
        invalid: 400,
        not_found: 404,
        conflict: 409,
        forbidden: 403,
      }[error.kind];
      body = {
        statusCode: status,
        code: error.code,
        message: translateErrorMessage(error.message, status),
      };
    } else if (error instanceof HttpException) {
      status = error.getStatus();
      if (status >= 500) {
        this.logger.error(error instanceof Error ? error.stack : String(error));
      }
      const response = error.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : typeof response === 'object' &&
              response !== null &&
              'message' in response
            ? response.message
            : undefined;
      const messages = Array.isArray(message)
        ? message.filter((item): item is string => typeof item === 'string')
        : typeof message === 'string'
          ? [message]
          : [];
      body = {
        statusCode: status,
        message: messages.length
          ? messages
              .map((message) => translateErrorMessage(message, status))
              .join(' ')
          : errorMessageForStatus(status),
      };
    } else {
      status = 500;
      this.logger.error(error instanceof Error ? error.stack : String(error));
      body = {
        statusCode: status,
        message: errorMessageForStatus(status),
      };
    }

    host.switchToHttp().getResponse<Response>().status(status).json(body);
  }
}
