const test = require('node:test');
const assert = require('node:assert/strict');

const { createWebSearchExtension } = require('../../src/index.js');
const {
  createBingHtml,
  createDdgBlockedHtml,
  createDdgHtml,
} = require('../helpers/fixtures.js');

test('healthCheck reports degraded after retryable DDG failures', async () => {
  const extension = createWebSearchExtension({
    config: { jitterMinMs: 0, jitterMaxMs: 0 },
    fetchFn: async (url) => ({ ok: true, status: 200, text: async () => url.includes('duckduckgo') ? createDdgBlockedHtml() : createBingHtml() }),
  });

  await extension.search({ query: 'openclaw', limit: 2, outputMode: 'summary' });
  const health = await extension.healthCheck();

  assert.equal(health.status, 'degraded');
  assert.equal(health.sources.ddg.status, 'degraded');
  assert.equal(health.sources.ddg.lastFailureType, 'captcha_detected');
});

test('healthCheck reports healthy after recovery successes', async () => {
  let useBlockedDdg = true;
  const extension = createWebSearchExtension({
    config: { jitterMinMs: 0, jitterMaxMs: 0 },
    fetchFn: async (url) => ({
      ok: true,
      status: 200,
      text: async () => {
        if (url.includes('duckduckgo')) {
          return useBlockedDdg ? createDdgBlockedHtml() : createDdgHtml();
        }

        return createBingHtml();
      },
    }),
  });

  await extension.search({ query: 'openclaw', limit: 2, outputMode: 'summary' });
  useBlockedDdg = false;
  await extension.search({ query: 'openclaw', limit: 2, outputMode: 'summary' });
  const health = await extension.healthCheck();

  assert.equal(health.status, 'healthy');
  assert.equal(health.sources.ddg.status, 'healthy');
});
