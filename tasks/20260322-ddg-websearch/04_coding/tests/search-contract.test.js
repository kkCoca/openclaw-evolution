const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateSearchRequest,
  createRequestContext,
  createErrorPayload,
} = require('../src/contracts/search-contract.js');

test('validateSearchRequest trims query and applies defaults', () => {
  const validated = validateSearchRequest({ query: '  openclaw  ' });

  assert.equal(validated.query, 'openclaw');
  assert.equal(validated.limit, 10);
  assert.equal(validated.outputMode, 'summary');
});

test('validateSearchRequest clamps limit to safe max', () => {
  const validated = validateSearchRequest({ query: 'openclaw', limit: 99, outputMode: 'detailed' });

  assert.equal(validated.limit, 20);
  assert.equal(validated.outputMode, 'detailed');
});

test('validateSearchRequest rejects blank query', () => {
  assert.throws(
    () => validateSearchRequest({ query: '   ' }),
    (error) => error.type === 'invalid_query' && error.retryable === false,
  );
});

test('createRequestContext adds request tracking metadata', () => {
  const context = createRequestContext({ query: 'openclaw', limit: 10, outputMode: 'summary' });

  assert.equal(typeof context.requestId, 'string');
  assert.equal(context.query, 'openclaw');
  assert.equal(typeof context.startedAt, 'number');
});

test('createErrorPayload returns normalized error fields', () => {
  const payload = createErrorPayload('timeout', true, 'request timed out', 'ddg');

  assert.deepEqual(payload, {
    type: 'timeout',
    retryable: true,
    message: 'request timed out',
    source: 'ddg',
  });
});
