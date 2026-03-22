const test = require('node:test');
const assert = require('node:assert/strict');

const { createWebSearchExtension } = require('../../src/index.js');
const {
  createBingHtml,
  createDdgBlockedHtml,
  createDdgHtml,
} = require('../helpers/fixtures.js');

test('search returns DDG response on primary success', async () => {
  const extension = createWebSearchExtension({
    config: { jitterMinMs: 0, jitterMaxMs: 0 },
    fetchFn: async (url) => ({ ok: true, status: 200, text: async () => url.includes('duckduckgo') ? createDdgHtml() : createBingHtml() }),
  });

  const response = await extension.search({ query: 'openclaw', limit: 2, outputMode: 'detailed' });

  assert.equal(response.sourceUsed, 'ddg');
  assert.equal(response.error, null);
  assert.equal(response.results.length, 2);
});

test('search returns Bing response when DDG throws retryable error', async () => {
  const extension = createWebSearchExtension({
    config: { jitterMinMs: 0, jitterMaxMs: 0 },
    fetchFn: async (url) => ({ ok: true, status: 200, text: async () => url.includes('duckduckgo') ? createDdgBlockedHtml() : createBingHtml() }),
  });

  const response = await extension.search({ query: 'openclaw', limit: 2, outputMode: 'summary' });

  assert.equal(response.sourceUsed, 'bing');
  assert.equal(response.fallbackUsed, true);
  assert.equal(response.partial, true);
  assert.equal(response.results.length, 2);
});

test('search returns all_sources_failed payload when both sources fail', async () => {
  const extension = createWebSearchExtension({
    config: { jitterMinMs: 0, jitterMaxMs: 0 },
    fetchFn: async () => ({ ok: false, status: 503, text: async () => 'busy' }),
  });

  const response = await extension.search({ query: 'openclaw', limit: 2, outputMode: 'summary' });

  assert.equal(response.results.length, 0);
  assert.equal(response.error.type, 'all_sources_failed');
  assert.equal(response.error.retryable, true);
});
