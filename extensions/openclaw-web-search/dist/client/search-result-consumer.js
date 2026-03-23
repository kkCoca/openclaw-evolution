const {
  mapResponseToDetailedView,
  mapResponseToSummaryView,
} = require('./view-mode-resolver.js');
const { presentSearchFeedback } = require('./search-feedback-presenter.js');

function mapResultItems(results, outputMode) {
  const response = { results };
  return outputMode === 'detailed'
    ? mapResponseToDetailedView(response)
    : mapResponseToSummaryView(response);
}

function createResultMeta(response) {
  return {
    sourceUsed: response.sourceUsed,
    relatedSearches: response.relatedSearches || [],
    partial: Boolean(response.partial),
    fallbackUsed: Boolean(response.fallbackUsed),
    tookMs: response.tookMs,
  };
}

function shouldShowRetryAction(response) {
  return Boolean(response.error && response.error.retryable);
}

function consumeSearchResponse(response, outputMode) {
  return {
    query: response.query,
    items: mapResultItems(response.results, outputMode),
    meta: createResultMeta(response),
    feedback: presentSearchFeedback(response),
    retryable: shouldShowRetryAction(response),
  };
}

module.exports = {
  consumeSearchResponse,
  createResultMeta,
  mapResultItems,
  shouldShowRetryAction,
};
