import { workflowHarness } from './support/workflow-harness.js';

describe('migrated-api migration workflows', () => {
  let h: Awaited<ReturnType<typeof workflowHarness>>;
  beforeAll(async () => {
    h = await workflowHarness();
  });
  beforeEach(async () => {
    await h.reset();
  });
  afterAll(async () => {
    await h?.app.close();
  });

  it('documents every requested legacy path with Bearer security', async () => {
    const doc = await h.raw().get('/api-json').expect(200);
    const routes = {
      '/horary': ['get'],
      '/appointments': ['get', 'post'],
      '/appointments/user': ['get'],
      '/sports': ['get'],
      '/sports/arena': ['get'],
      '/sports/material': ['get'],
      '/team': ['get', 'post', 'put'],
      '/team/exist': ['get'],
      '/team/user': ['post', 'put'],
      '/friend': ['get', 'post', 'put'],
      '/arenas': ['get', 'post', 'put'],
      '/arenas/sports': ['get'],
      '/arenas/users': ['get'],
      '/arenas/admin': ['get'],
    };
    for (const [path, methods] of Object.entries(routes)) {
      for (const method of methods) {
        const operation = doc.body.paths[path]?.[method];
        expect(operation, `${method.toUpperCase()} ${path}`).toBeDefined();
        expect(operation.security).toEqual([{ bearer: [] }]);
        const responses = Object.entries(operation.responses).filter(([code]) =>
          code.startsWith('2'),
        );
        expect(responses.length).toBeGreaterThan(0);
        for (const [, response] of responses) {
          expect(response).toHaveProperty('content.application/json.schema');
        }
      }
    }
  });
});
