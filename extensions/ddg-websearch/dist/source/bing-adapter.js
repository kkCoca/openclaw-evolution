const { parseBingDocument } = require('../parser/bing-parser.js');
const { toSearchError } = require('../error/search-error.js');

class BingAdapter {
  constructor(deps) {
    this.httpClient = deps.httpClient;
    this.antiBotGuard = deps.antiBotGuard;
    this.config = deps.config;
  }

  buildSearchUrl(query) {
    return `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
  }

  async fetchBing(query, limit) {
    const startedAt = Date.now();
    try {
      const policy = await this.antiBotGuard.beforeRequest('bing');
      const response = await this.httpClient.getHtml(this.buildSearchUrl(query, limit), {
        headers: policy.headers,
        source: 'bing',
        timeoutMs: this.config.bingTimeoutMs,
      });
      const parsed = parseBingDocument(response.body, limit);
      this.antiBotGuard.recordSuccess('bing');

      return {
        source: 'bing',
        results: parsed.results,
        relatedSearches: parsed.relatedSearches,
        partial: parsed.results.length < limit,
        fallbackUsed: false,
        tookMs: Date.now() - startedAt,
      };
    } catch (error) {
      const normalized = toSearchError(error, { type: 'parse_error', retryable: true, source: 'bing' });
      this.antiBotGuard.recordFailure('bing', normalized);
      throw normalized;
    }
  }
}

module.exports = {
  BingAdapter,
};
