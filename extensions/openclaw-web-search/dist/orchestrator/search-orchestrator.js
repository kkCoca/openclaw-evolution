const { createRequestContext, validateSearchRequest } = require('../contracts/search-contract.js');
const { toSearchError } = require('../error/search-error.js');

class SearchOrchestrator {
  constructor(deps) {
    this.router = deps.router;
    this.formatter = deps.formatter;
    this.logger = deps.logger;
    this.healthService = deps.healthService;
  }

  async search(request) {
    const validatedRequest = validateSearchRequest(request);
    const context = createRequestContext(validatedRequest);

    try {
      const sourceResponse = await this.router.execute(validatedRequest, context);
      const response = this.formatter.format(sourceResponse, validatedRequest, context);
      this.logger.info(this.logger.createSearchEvent(context, response));
      return response;
    } catch (error) {
      const searchError = toSearchError(error, { source: 'bing' });
      const response = this.formatter.formatErrorResponse(searchError, validatedRequest, context);
      this.logger.error(this.logger.createSearchEvent(context, response, searchError));
      return response;
    }
  }

  async healthCheck() {
    return this.healthService.getHealthCheckResponse();
  }
}

module.exports = {
  SearchOrchestrator,
};
