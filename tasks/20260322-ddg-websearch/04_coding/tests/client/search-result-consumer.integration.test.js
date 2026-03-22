const test = require('node:test');
const assert = require('node:assert/strict');

const { consumeSearchResponse } = require('../../src/client/search-result-consumer.js');
const { createSearchResponse } = require('../helpers/fixtures.js');

test('consumeSearchResponse maps summary mode correctly', () => {
  const view = consumeSearchResponse(createSearchResponse({ outputMode: 'summary' }), 'summary');

  assert.deepEqual(view.items[0], {
    title: 'Alpha Result',
    url: 'https://example.com/alpha',
  });
});

test('consumeSearchResponse maps detailed mode correctly', () => {
  const view = consumeSearchResponse(createSearchResponse({ outputMode: 'detailed' }), 'detailed');

  assert.deepEqual(view.items[0], {
    title: 'Alpha Result',
    url: 'https://example.com/alpha',
    snippet: 'Alpha snippet',
    source: 'ddg',
  });
});

test('consumeSearchResponse preserves relatedSearches and sourceUsed metadata', () => {
  const view = consumeSearchResponse(createSearchResponse({ sourceUsed: 'bing', partial: true }), 'detailed');

  assert.deepEqual(view.meta.relatedSearches, ['alpha news']);
  assert.equal(view.meta.sourceUsed, 'bing');
  assert.equal(view.meta.partial, true);
});
