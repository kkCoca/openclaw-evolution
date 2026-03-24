const { SearchError, toSearchError } = require('../error/search-error.js');

class SourceRouter {
  constructor(deps) {
    this.ddgAdapter = deps.ddgAdapter;
    this.bingAdapter = deps.bingAdapter;
    this.healthService = deps.healthService;
    this.logger = deps.logger;
  }

  async execute(request, context) {
    try {
      const ddgResult = await this.ddgAdapter.fetchDdg(request.query, request.limit, context);
      this.healthService.recordSourceSuccess('ddg');
      return ddgResult;
    } catch (error) {
      const ddgError = toSearchError(error, { source: 'ddg' });
      this.healthService.recordSourceFailure('ddg', ddgError);
      this.logger.warn({ requestId: context.requestId, failureType: ddgError.type, source: 'ddg' });

      if (!this.shouldFallback(ddgError)) {
        throw ddgError;
      }

      try {
        const bingResult = await this.bingAdapter.fetchBing(request.query, request.limit, context);
        this.healthService.recordSourceSuccess('bing');
        return {
          ...bingResult,
          fallbackUsed: true,
          partial: true,
          primaryFailureType: ddgError.type,
        };
      } catch (fallbackError) {
        const bingError = toSearchError(fallbackError, { source: 'bing' });
        this.healthService.recordSourceFailure('bing', bingError);
        throw this.createAllSourcesFailedError([ddgError, bingError]);
      }
    }
  }

  shouldFallback(error) {
    return new Set(['timeout', 'rate_limit', 'captcha_detected', 'parse_error']).has(error.type);
  }

  createAllSourcesFailedError(errors) {
    const retryable = errors.some((error) => error.retryable);
    return new SearchError('all_sources_failed', 'All search sources failed', retryable, errors[errors.length - 1].source, errors);
  }
}

module.exports = {
  SourceRouter,
};
