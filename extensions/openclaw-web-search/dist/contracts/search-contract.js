const { randomUUID, createHash } = require('node:crypto');

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;
const DEFAULT_OUTPUT_MODE = 'summary';
const OUTPUT_MODES = new Set(['summary', 'detailed']);

const { SearchError } = require('../error/search-error.js');

function validateSearchRequest(request = {}) {
  const query = typeof request.query === 'string' ? request.query.trim() : '';
  if (!query) {
    throw new SearchError('invalid_query', 'Query must not be empty', false);
  }
  if (query.length > 200) {
    throw new SearchError('invalid_query', 'Query must be 200 characters or fewer', false);
  }

  const requestedLimit = Number.isFinite(request.limit) ? Math.trunc(request.limit) : DEFAULT_LIMIT;
  const limit = Math.max(1, Math.min(requestedLimit, MAX_LIMIT));
  const outputMode = request.outputMode || DEFAULT_OUTPUT_MODE;
  if (!OUTPUT_MODES.has(outputMode)) {
    throw new SearchError('invalid_output_mode', 'Output mode must be summary or detailed', false);
  }

  return {
    query,
    limit,
    outputMode,
  };
}

function createRequestContext(request, nowFn = Date.now) {
  return {
    requestId: randomUUID(),
    query: request.query,
    queryHash: createHash('sha1').update(request.query).digest('hex'),
    startedAt: nowFn(),
  };
}

function createErrorPayload(type, retryable, message, source) {
  return {
    type,
    retryable: Boolean(retryable),
    message,
    source,
  };
}

function createHealthSummary(sources, config) {
  const statuses = Object.values(sources).map((source) => source.status);
  const status = statuses.every((item) => item === 'healthy') ? 'healthy' : 'degraded';

  return {
    status,
    sources,
    config,
  };
}

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  DEFAULT_OUTPUT_MODE,
  createErrorPayload,
  createHealthSummary,
  createRequestContext,
  validateSearchRequest,
};
