const { DEFAULT_LIMIT, MAX_LIMIT } = require('../contracts/search-contract.js');

function readNumber(source, camelKey, envKey, fallback) {
  if (source[camelKey] !== undefined) {
    return Number(source[camelKey]);
  }
  if (source[envKey] !== undefined) {
    return Number(source[envKey]);
  }
  return fallback;
}

function readString(source, camelKey, envKey, fallback) {
  if (source[camelKey] !== undefined) {
    return String(source[camelKey]);
  }
  if (source[envKey] !== undefined) {
    return String(source[envKey]);
  }
  return fallback;
}

function validateRuntimeConfig(config) {
  const normalized = { ...config };

  normalized.defaultLimit = Math.max(1, Math.min(Math.trunc(normalized.defaultLimit), normalized.maxLimit));
  normalized.maxLimit = Math.max(1, Math.trunc(normalized.maxLimit));
  normalized.ddgTimeoutMs = Math.max(1, Math.trunc(normalized.ddgTimeoutMs));
  normalized.bingTimeoutMs = Math.max(1, Math.trunc(normalized.bingTimeoutMs));
  normalized.jitterMinMs = Math.max(0, Math.trunc(normalized.jitterMinMs));
  normalized.jitterMaxMs = Math.max(normalized.jitterMinMs, Math.trunc(normalized.jitterMaxMs));
  normalized.backoffBaseMs = Math.max(0, Math.trunc(normalized.backoffBaseMs));

  return normalized;
}

function loadRuntimeConfig(source = {}) {
  return validateRuntimeConfig({
    ddgTimeoutMs: readNumber(source, 'ddgTimeoutMs', 'DDG_TIMEOUT_MS', 3000),
    bingTimeoutMs: readNumber(source, 'bingTimeoutMs', 'BING_TIMEOUT_MS', 3000),
    defaultLimit: readNumber(source, 'defaultLimit', 'SEARCH_DEFAULT_LIMIT', DEFAULT_LIMIT),
    maxLimit: readNumber(source, 'maxLimit', 'SEARCH_MAX_LIMIT', MAX_LIMIT),
    jitterMinMs: readNumber(source, 'jitterMinMs', 'SEARCH_JITTER_MIN_MS', 200),
    jitterMaxMs: readNumber(source, 'jitterMaxMs', 'SEARCH_JITTER_MAX_MS', 800),
    backoffBaseMs: readNumber(source, 'backoffBaseMs', 'SEARCH_BACKOFF_BASE_MS', 1000),
    logQueryPolicy: readString(source, 'logQueryPolicy', 'SEARCH_LOG_QUERY_POLICY', 'hash'),
    defaultHeaders: {
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
      referer: 'https://duckduckgo.com/',
    },
  });
}

function getPublicConfigSummary(config) {
  return {
    ddgTimeoutMs: config.ddgTimeoutMs,
    bingTimeoutMs: config.bingTimeoutMs,
    defaultLimit: config.defaultLimit,
    maxLimit: config.maxLimit,
    jitterMinMs: config.jitterMinMs,
    jitterMaxMs: config.jitterMaxMs,
    backoffBaseMs: config.backoffBaseMs,
  };
}

module.exports = {
  getPublicConfigSummary,
  loadRuntimeConfig,
  validateRuntimeConfig,
};
