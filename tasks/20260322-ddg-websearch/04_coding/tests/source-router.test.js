const test = require('node:test');
const assert = require('node:assert/strict');

const { SourceRouter } = require('../src/router/source-router.js');
const { SearchError } = require('../src/error/search-error.js');

function createRouter(overrides = {}) {
  return new SourceRouter({
    ddgAdapter: overrides.ddgAdapter,
    bingAdapter: overrides.bingAdapter,
    healthService: overrides.healthService || { recordSourceFailure() {}, recordSourceSuccess() {} },
    logger: overrides.logger || { warn() {}, error() {} },
  });
}

test('execute returns DDG result when primary source succeeds', async () => {
  const router = createRouter({
    ddgAdapter: { async fetchDdg() { return { source: 'ddg', results: [{ title: 'Alpha' }], relatedSearches: [], partial: false, tookMs: 20 }; } },
    bingAdapter: { async fetchBing() { throw new Error('should not be called'); } },
  });

  const result = await router.execute({ query: 'openclaw', limit: 10 }, { requestId: 'req-1' });
  assert.equal(result.source, 'ddg');
});

test('execute falls back to Bing on retryable DDG failure', async () => {
  const router = createRouter({
    ddgAdapter: {
      async fetchDdg() {
        throw new SearchError('timeout', 'primary timed out', true, 'ddg');
      },
    },
    bingAdapter: {
      async fetchBing() {
        return { source: 'bing', results: [{ title: 'Bing' }], relatedSearches: [], partial: false, tookMs: 30 };
      },
    },
  });

  const result = await router.execute({ query: 'openclaw', limit: 10 }, { requestId: 'req-2' });
  assert.equal(result.source, 'bing');
  assert.equal(result.fallbackUsed, true);
  assert.equal(result.partial, true);
});

test('execute throws all_sources_failed when both sources fail', async () => {
  const router = createRouter({
    ddgAdapter: {
      async fetchDdg() {
        throw new SearchError('timeout', 'primary timed out', true, 'ddg');
      },
    },
    bingAdapter: {
      async fetchBing() {
        throw new SearchError('timeout', 'fallback timed out', true, 'bing');
      },
    },
  });

  await assert.rejects(
    () => router.execute({ query: 'openclaw', limit: 10 }, { requestId: 'req-3' }),
    (error) => error.type === 'all_sources_failed' && error.retryable === true,
  );
});
