const { resolveOutputMode } = require('./view-mode-resolver.js');
const { consumeSearchResponse } = require('./search-result-consumer.js');

class OpenClawSearchClient {
  constructor(extension) {
    this.extension = extension;
  }

  buildSearchRequest(query, options = {}) {
    return {
      query,
      limit: options.limit,
      outputMode: resolveOutputMode(options),
    };
  }

  async search(query, options = {}) {
    const request = this.buildSearchRequest(query, options);
    const response = await this.extension.search(request);
    return consumeSearchResponse(response, request.outputMode);
  }
}

module.exports = {
  OpenClawSearchClient,
};
