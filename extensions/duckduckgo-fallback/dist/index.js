/**
 * DDG Fallback - dependency injection implementation
 * @version 1.0.0
 */

class DDGFallback {
  constructor(options = {}) {
    this.primarySearch = options.primarySearch || this._defaultPrimarySearch;
    this.fallbackSearch = options.fallbackSearch || this._defaultFallbackSearch;

    this.maxRetries = options.maxRetries || 3;
    this.baseDelayMs = options.baseDelayMs || 1000;
    this.timeoutMs = options.timeoutMs || 10000;
  }

  async search(query) {
    try {
      return await this.primarySearch(query);
    } catch (error) {
      if (this.shouldFallback(error)) {
        console.log('Primary search failed, fallback to DDG');
        return await this.fallbackSearch(query);
      }
      throw error;
    }
  }

  _defaultPrimarySearch() {
    throw new Error('Primary search not implemented - please provide options.primarySearch');
  }

  _defaultFallbackSearch() {
    throw new Error('Fallback search not implemented - please provide options.fallbackSearch');
  }

  shouldFallback(error) {
    const fallbackCodes = [429, 503, 504];

    return (
      fallbackCodes.includes(error == null ? undefined : error.code) ||
      (error && error.message && error.message.includes('timeout')) ||
      (error && error.message && error.message.includes('ETIMEDOUT'))
    );
  }
}

module.exports = DDGFallback;
