import { assertPageRequest, paginate } from './pagination.js';
it('describes empty, intermediate, last and out-of-range pages consistently', () => {
  expect(paginate([], 0, { page: 1, limit: 20 })).toMatchObject({
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  expect(paginate(['a'], 3, { page: 1, limit: 2 })).toMatchObject({
    totalPages: 2,
    hasNextPage: true,
    hasPreviousPage: false,
  });
  expect(paginate(['b'], 3, { page: 2, limit: 2 })).toMatchObject({
    totalPages: 2,
    hasNextPage: false,
    hasPreviousPage: true,
  });
  expect(paginate([], 3, { page: 5, limit: 2 })).toMatchObject({
    totalPages: 2,
    hasNextPage: false,
    hasPreviousPage: true,
  });
});
it.each([
  { page: 0, limit: 1 },
  { page: 1, limit: 51 },
  { page: 1.5, limit: 10 },
])('rejects invalid page input outside HTTP too', (query) => {
  expect(() => assertPageRequest(query)).toThrow();
});
