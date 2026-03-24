const { createHealthSummary } = require('../contracts/search-contract.js');
const { getPublicConfigSummary } = require('../config/runtime-config.js');

class HealthService {
  constructor(config) {
    this.config = config;
    this.sources = {
      ddg: this.createSourceState(),
      bing: this.createSourceState(),
    };
  }

  createSourceState() {
    return {
      status: 'healthy',
      consecutiveFailures: 0,
      lastFailureType: null,
      lastFailureAt: null,
      lastSuccessAt: null,
    };
  }

  recordSourceSuccess(source) {
    this.sources[source] = {
      ...this.sources[source],
      status: 'healthy',
      consecutiveFailures: 0,
      lastSuccessAt: Date.now(),
    };
  }

  recordSourceFailure(source, error) {
    this.sources[source] = {
      ...this.sources[source],
      status: 'degraded',
      consecutiveFailures: this.sources[source].consecutiveFailures + 1,
      lastFailureType: error.type,
      lastFailureAt: Date.now(),
    };
  }

  getSourceState(source) {
    return { ...this.sources[source] };
  }

  getHealthCheckResponse() {
    return createHealthSummary(
      {
        ddg: this.getSourceState('ddg'),
        bing: this.getSourceState('bing'),
      },
      getPublicConfigSummary(this.config),
    );
  }
}

module.exports = {
  HealthService,
};
