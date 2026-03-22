const test = require('node:test');
const assert = require('node:assert/strict');

const {
  shouldShowRetryAction,
  consumeSearchResponse,
} = require('../../src/client/search-result-consumer.js');
const { presentSearchFeedback } = require('../../src/client/search-feedback-presenter.js');
const { createSearchResponse } = require('../helpers/fixtures.js');

test('presentSearchFeedback marks fallback success as usable result', () => {
  const feedback = presentSearchFeedback(createSearchResponse({ sourceUsed: 'bing', fallbackUsed: true, partial: true }));

  assert.equal(feedback.kind, 'degraded');
  assert.equal(feedback.usable, true);
});

test('shouldShowRetryAction returns true only for retryable failures', () => {
  const retryableResponse = createSearchResponse({
    results: [],
    error: { type: 'timeout', retryable: true, message: 'timed out', source: 'bing' },
  });
  const nonRetryableResponse = createSearchResponse({
    results: [],
    error: { type: 'invalid_query', retryable: false, message: 'bad query', source: 'ddg' },
  });

  assert.equal(shouldShowRetryAction(retryableResponse), true);
  assert.equal(shouldShowRetryAction(nonRetryableResponse), false);
});

test('presentSearchFeedback distinguishes empty results from hard failures', () => {
  const emptyView = consumeSearchResponse(createSearchResponse({ results: [], relatedSearches: [] }), 'summary');
  const failureView = consumeSearchResponse(createSearchResponse({
    results: [],
    error: { type: 'all_sources_failed', retryable: true, message: 'all failed', source: 'bing' },
  }), 'summary');

  assert.equal(emptyView.feedback.kind, 'empty');
  assert.equal(failureView.feedback.kind, 'failure');
});
