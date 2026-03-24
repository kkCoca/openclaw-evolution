const { parseDdgDocument } = require('../parser/ddg-parser.js');
const { toSearchError } = require('../error/search-error.js');

class DdgAdapter {
  constructor(deps) {
    this.httpClient = deps.httpClient;
    this.antiBotGuard = deps.antiBotGuard;
    this.config = deps.config;
  }

  buildSearchUrl(query) {
    return `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  }

  async fetchDdg(query, limit) {
    const startedAt = Date.now();
    try {
      const policy = await this.antiBotGuard.beforeRequest('ddg');
      const response = await this.httpClient.getHtml(this.buildSearchUrl(query, limit), {
        headers: policy.headers,
        source: 'ddg',
        timeoutMs: this.config.ddgTimeoutMs,
      });
      const parsed = parseDdgDocument(response.body, limit);
      this.antiBotGuard.recordSuccess('ddg');

      return {
        source: 'ddg',
        results: parsed.results,
        relatedSearches: parsed.relatedSearches,
        partial: parsed.results.length < limit,
        fallbackUsed: false,
        tookMs: Date.now() - startedAt,
      };
    } catch (error) {
      const normalized = toSearchError(error, { type: 'parse_error', retryable: true, source: 'ddg' });
      this.antiBotGuard.recordFailure('ddg', normalized);
      throw normalized;
    }
  }
}

module.exports = {
  DdgAdapter,
};
