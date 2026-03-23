const { createHash } = require('node:crypto');

class SearchLogger {
  constructor(options = {}) {
    this.sink = options.sink || [];
    this.nowFn = options.nowFn || Date.now;
  }

  info(event) {
    this.push('info', event);
  }

  warn(event) {
    this.push('warn', event);
  }

  error(event) {
    this.push('error', event);
  }

  push(level, event) {
    const payload = {
      level,
      timestamp: this.nowFn(),
      ...event,
    };
    if (Array.isArray(this.sink)) {
      this.sink.push(payload);
    }
  }

  createSearchEvent(context, response, error) {
    return {
      requestId: context.requestId,
      queryHash: createHash('sha1').update(context.query).digest('hex'),
      queryLength: context.query.length,
      sourceUsed: response ? response.sourceUsed : null,
      tookMs: response ? response.tookMs : this.nowFn() - context.startedAt,
      resultCount: response ? response.results.length : 0,
      failureType: error ? error.type : response && response.error ? response.error.type : null,
      partial: response ? response.partial : false,
      fallbackUsed: response ? response.fallbackUsed : false,
    };
  }
}

module.exports = {
  SearchLogger,
};
