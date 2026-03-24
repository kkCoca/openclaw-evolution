const { createErrorPayload } = require('../contracts/search-contract.js');

class ResponseFormatter {
  format(sourceResponse, request, context) {
    return {
      query: request.query,
      results: this.formatResults(sourceResponse.results, request.outputMode),
      relatedSearches: sourceResponse.relatedSearches || [],
      sourceUsed: sourceResponse.source,
      outputMode: request.outputMode,
      tookMs: Date.now() - context.startedAt,
      partial: Boolean(sourceResponse.partial),
      fallbackUsed: Boolean(sourceResponse.fallbackUsed),
      error: null,
    };
  }

  formatErrorResponse(error, request, context) {
    return {
      query: request.query,
      results: [],
      relatedSearches: [],
      sourceUsed: error.source || 'bing',
      outputMode: request.outputMode,
      tookMs: Date.now() - context.startedAt,
      partial: false,
      fallbackUsed: false,
      error: createErrorPayload(error.type, error.retryable, error.message, error.source),
    };
  }

  formatResults(results, outputMode) {
    if (outputMode === 'summary') {
      return results.map((item) => ({
        title: item.title,
        url: item.url,
        source: item.source,
      }));
    }

    return results.map((item) => ({ ...item }));
  }
}

module.exports = {
  ResponseFormatter,
};
