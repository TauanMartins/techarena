import { ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HealthController } from './health.controller.js';

it('checks PostgreSQL before reporting healthy', async () => {
  const dataSource = { query: vi.fn().mockResolvedValue([{ '?column?': 1 }]) };
  const controller = new HealthController(dataSource as unknown as DataSource);
  await expect(controller.check()).resolves.toEqual({
    status: 'ok',
    database: 'up',
  });
  expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
});

it('reports 503 without exposing a database failure', async () => {
  const dataSource = {
    query: vi.fn().mockRejectedValue(new Error('secret connection detail')),
  };
  await expect(
    new HealthController(dataSource as unknown as DataSource).check(),
  ).rejects.toBeInstanceOf(ServiceUnavailableException);
});
