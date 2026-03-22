const test = require('node:test');
const assert = require('node:assert/strict');

const { createWebSearchExtension } = require('../../src/index.js');
const { createDdgHtml } = require('../helpers/fixtures.js');

test('search logger emits source, tookMs, resultCount and failureType fields', async () => {
  const events = [];
  const extension = createWebSearchExtension({
    config: { jitterMinMs: 0, jitterMaxMs: 0 },
    loggerSink: events,
    fetchFn: async () => ({ ok: true, status: 200, text: async () => createDdgHtml() }),
  });

  await extension.search({ query: 'openclaw', limit: 2, outputMode: 'detailed' });

  assert.ok(events.length > 0);
  assert.equal(events[0].sourceUsed, 'ddg');
  assert.equal(typeof events[0].tookMs, 'number');
  assert.equal(events[0].resultCount, 2);
  assert.equal(events[0].failureType, null);
});

test('search logger does not persist raw sensitive query content outside request metadata policy', async () => {
  const events = [];
  const extension = createWebSearchExtension({
    config: { jitterMinMs: 0, jitterMaxMs: 0 },
    loggerSink: events,
    fetchFn: async () => ({ ok: true, status: 200, text: async () => createDdgHtml() }),
  });

  await extension.search({ query: 'sensitive query text', limit: 2, outputMode: 'summary' });

  assert.equal(events[0].query, undefined);
  assert.equal(typeof events[0].queryHash, 'string');
  assert.equal(events[0].queryLength, 'sensitive query text'.length);
});
