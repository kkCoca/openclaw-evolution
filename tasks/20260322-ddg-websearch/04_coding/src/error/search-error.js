class SearchError extends Error {
  constructor(type, message, retryable, source, cause) {
    super(message);
    this.name = 'SearchError';
    this.type = type;
    this.retryable = Boolean(retryable);
    this.source = source;
    this.cause = cause;
  }
}

function toSearchError(error, fallback = {}) {
  if (error instanceof SearchError) {
    return error;
  }

  return new SearchError(
    fallback.type || 'unknown_error',
    fallback.message || (error && error.message) || 'Unexpected search failure',
    fallback.retryable !== undefined ? fallback.retryable : true,
    fallback.source,
    error,
  );
}

function isRetryableError(error) {
  return Boolean(error && error.retryable);
}

module.exports = {
  SearchError,
  isRetryableError,
  toSearchError,
};
