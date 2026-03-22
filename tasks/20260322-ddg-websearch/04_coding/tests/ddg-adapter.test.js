const test = require('node:test');
const assert = require('node:assert/strict');

const { DdgAdapter } = require('../src/source/ddg-adapter.js');
const { loadRuntimeConfig } = require('../src/config/runtime-config.js');
const { createDdgHtml, createDdgEmptyHtml } = require('./helpers/fixtures.js');

function createAdapter(html) {
  const antiBotGuard = {
    async beforeRequest() {
      return { headers: { 'user-agent': 'test' }, delayMs: 0 };
    },
    recordFailure() {},
    recordSuccess() {},
  };

  const httpClient = {
    async getHtml() {
      return { status: 200, url: 'https://duckduckgo.com/html/?q=openclaw', body: html };
    },
  };

  return new DdgAdapter({
    antiBotGuard,
    config: loadRuntimeConfig({ SEARCH_JITTER_MIN_MS: '0', SEARCH_JITTER_MAX_MS: '0' }),
    httpClient,
  });
}

test('fetchDdg returns normalized results on success', async () => {
  const adapter = createAdapter(createDdgHtml());
  const response = await adapter.fetchDdg('openclaw', 2, { requestId: 'req-1', startedAt: Date.now() });

  assert.equal(response.source, 'ddg');
  assert.equal(response.results.length, 2);
  assert.deepEqual(response.relatedSearches, ['alpha news', 'alpha docs']);
  assert.equal(response.results[0].title, 'Alpha Result');
});

test('fetchDdg returns empty results without throwing when no items found', async () => {
  const adapter = createAdapter(createDdgEmptyHtml());
  const response = await adapter.fetchDdg('openclaw', 10, { requestId: 'req-2', startedAt: Date.now() });

  assert.deepEqual(response.results, []);
  assert.deepEqual(response.relatedSearches, []);
  assert.equal(response.partial, true);
});

test('fetchDdg throws parse_error when document shape is invalid', async () => {
  const adapter = createAdapter('<html><body><div>unexpected</div></body></html>');

  await assert.rejects(
    () => adapter.fetchDdg('openclaw', 10, { requestId: 'req-3', startedAt: Date.now() }),
    (error) => error.type === 'parse_error' && error.source === 'ddg',
  );
});
