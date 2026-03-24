const { loadRuntimeConfig } = require('./config/runtime-config.js');
const { AntiBotGuard } = require('./guard/anti-bot-guard.js');
const { HttpClient } = require('./http/http-client.js');
const { DdgAdapter } = require('./source/ddg-adapter.js');
const { BingAdapter } = require('./source/bing-adapter.js');
const { HealthService } = require('./health/health-service.js');
const { SearchLogger } = require('./logging/search-logger.js');
const { SourceRouter } = require('./router/source-router.js');
const { ResponseFormatter } = require('./formatter/response-formatter.js');
const { SearchOrchestrator } = require('./orchestrator/search-orchestrator.js');
const { OpenClawSearchClient } = require('./client/openclaw-search-client.js');

function createWebSearchExtension(options = {}) {
  const config = loadRuntimeConfig(options.config || {});
  const healthService = new HealthService(config);
  const antiBotGuard = new AntiBotGuard(config, {
    nowFn: options.nowFn,
    randomFn: options.randomFn,
    sleepFn: options.sleepFn,
  });
  const httpClient = new HttpClient(options.fetchFn);
  const logger = new SearchLogger({ sink: options.loggerSink, nowFn: options.nowFn });
  const ddgAdapter = new DdgAdapter({ httpClient, antiBotGuard, config });
  const bingAdapter = new BingAdapter({ httpClient, antiBotGuard, config });
  const router = new SourceRouter({ ddgAdapter, bingAdapter, healthService, logger });
  const formatter = new ResponseFormatter();
  const orchestrator = new SearchOrchestrator({ router, formatter, logger, healthService });

  return {
    search: (request) => orchestrator.search(request),
    healthCheck: () => orchestrator.healthCheck(),
    createClient: () => new OpenClawSearchClient({ search: orchestrator.search.bind(orchestrator) }),
  };
}

const defaultExtension = createWebSearchExtension();

async function search(request) {
  return defaultExtension.search(request);
}

async function healthCheck() {
  return defaultExtension.healthCheck();
}

module.exports = {
  createWebSearchExtension,
  healthCheck,
  search,
};
