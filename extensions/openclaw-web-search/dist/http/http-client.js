const { SearchError } = require('../error/search-error.js');

class HttpClient {
  constructor(fetchFn = globalThis.fetch) {
    this.fetchFn = fetchFn;
  }

  async getHtml(url, options = {}) {
    const response = await this.withTimeout(
      this.fetchFn(url, {
        headers: options.headers,
      }),
      options.timeoutMs,
      options.source,
    );

    if (!response.ok) {
      throw this.mapHttpError(response.status, options.source);
    }

    const body = await response.text();
    return {
      body,
      status: response.status,
      url,
    };
  }

  async withTimeout(promise, timeoutMs, source) {
    let timeoutId;
    try {
      return await Promise.race([
        promise,
        new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new SearchError('timeout', 'Search request timed out', true, source));
          }, timeoutMs);
        }),
      ]);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  mapHttpError(status, source) {
    if (status === 429) {
      return new SearchError('rate_limit', 'Search source rate limited the request', true, source);
    }
    if (status === 408 || status === 504 || status >= 500) {
      return new SearchError('timeout', `Search source responded with ${status}`, true, source);
    }

    return new SearchError('source_error', `Search source responded with ${status}`, false, source);
  }
}

module.exports = {
  HttpClient,
};
