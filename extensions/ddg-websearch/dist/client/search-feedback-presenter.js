function createDegradedFeedback(response) {
  return {
    kind: 'degraded',
    message: `Primary source unavailable, returned ${response.sourceUsed.toUpperCase()} fallback results`,
    retryable: false,
    usable: true,
  };
}

function createPartialFeedback(response) {
  return {
    kind: 'partial',
    message: 'Search returned fewer results than requested',
    retryable: false,
    usable: true,
  };
}

function createFailureFeedback(error) {
  return {
    kind: 'failure',
    message: error.message,
    retryable: Boolean(error.retryable),
    usable: false,
  };
}

function createEmptyStateFeedback() {
  return {
    kind: 'empty',
    message: 'No results found for the current query',
    retryable: false,
    usable: true,
  };
}

function presentSearchFeedback(response) {
  if (response.error) {
    return createFailureFeedback(response.error);
  }
  if (response.results.length === 0) {
    return createEmptyStateFeedback(response);
  }
  if (response.fallbackUsed) {
    return createDegradedFeedback(response);
  }
  if (response.partial) {
    return createPartialFeedback(response);
  }

  return {
    kind: 'success',
    message: 'Search completed successfully',
    retryable: false,
    usable: true,
  };
}

module.exports = {
  createDegradedFeedback,
  createEmptyStateFeedback,
  createFailureFeedback,
  createPartialFeedback,
  presentSearchFeedback,
};
