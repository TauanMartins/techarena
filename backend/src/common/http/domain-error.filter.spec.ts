import type { ArgumentsHost } from '@nestjs/common';
import { BadRequestException, Logger } from '@nestjs/common';
import { DomainError } from '../domain/domain-error.js';
import { DomainErrorFilter } from './domain-error.filter.js';

function responseFixture() {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;
  return { response, host };
}

describe('DomainErrorFilter', () => {
  it('translates domain errors and retains their public code', () => {
    const { response, host } = responseFixture();
    new DomainErrorFilter().catch(
      new DomainError('not_found', 'TEAM_NOT_FOUND', 'Team not found'),
      host,
    );

    expect(response.status.mock.calls).toEqual([[404]]);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 404,
      code: 'TEAM_NOT_FOUND',
      message: 'Equipe não encontrada.',
    });
  });

  it('localizes HTTP errors and uses a Portuguese fallback for unknown messages', () => {
    const { response, host } = responseFixture();
    new DomainErrorFilter().catch(
      new BadRequestException('Unknown framework message'),
      host,
    );

    expect(response.status.mock.calls).toEqual([[400]]);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Os dados enviados são inválidos.',
    });
  });

  it('does not expose unexpected internal error details', () => {
    const { response, host } = responseFixture();
    const logger = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    new DomainErrorFilter().catch(
      new Error('database connection secret'),
      host,
    );

    expect(response.status.mock.calls).toEqual([[500]]);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Não foi possível concluir a solicitação. Tente novamente.',
    });
    expect(logger).toHaveBeenCalled();
    logger.mockRestore();
  });
});
