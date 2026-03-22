const test = require('node:test');
const assert = require('node:assert/strict');

const {
  presentSearchFeedback,
} = require('../src/client/search-feedback-presenter.js');
const { createSearchResponse } = require('./helpers/fixtures.js');

test('presentSearchFeedback returns degraded feedback for fallback success', () => {
  const feedback = presentSearchFeedback(createSearchResponse({ sourceUsed: 'bing', fallbackUsed: true, partial: true }));

  assert.equal(feedback.kind, 'degraded');
  assert.equal(feedback.retryable, false);
});

test('presentSearchFeedback returns retryable failure feedback when error.retryable is true', () => {
  const feedback = presentSearchFeedback(createSearchResponse({
    results: [],
    error: { type: 'timeout', retryable: true, message: 'timed out', source: 'bing' },
  }));

  assert.equal(feedback.kind, 'failure');
  assert.equal(feedback.retryable, true);
});

test('presentSearchFeedback returns empty state feedback for empty results', () => {
  const feedback = presentSearchFeedback(createSearchResponse({ results: [], relatedSearches: [] }));

  assert.equal(feedback.kind, 'empty');
});
