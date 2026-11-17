import type { DirectoryQuery } from '../domain/directory.js';
import type { DirectoryRepository } from './ports/directory-repository.port.js';
import { DirectoryApplication } from './directory.application.js';
const query: DirectoryQuery = {
  search: ' Alice ',
  searchBy: 'all',
  sortBy: 'username',
  sortOrder: 'asc',
  page: 1,
  limit: 20,
};
it('normalizes search and passes only validated sort choices to its port', async () => {
  const repository = { search: vi.fn().mockResolvedValue({ items: [] }) };
  await new DirectoryApplication(
    repository as unknown as DirectoryRepository,
  ).search(query);
  expect(repository.search).toHaveBeenCalledWith({ ...query, search: 'Alice' });
});
it('rejects injected ordering before persistence', () => {
  const repository = { search: vi.fn() };
  expect(() =>
    new DirectoryApplication(
      repository as unknown as DirectoryRepository,
    ).search({
      ...query,
      sortBy: 'id; DROP TABLE users',
    } as unknown as DirectoryQuery),
  ).toThrow();
  expect(repository.search).not.toHaveBeenCalled();
});
