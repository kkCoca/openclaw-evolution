import { DdgAdapter } from './ddg-adapter.js';
import { FallbackManager } from './fallback-manager.js';
import {
  DEFAULT_FALLBACK_CONFIG,
  DdgSearchAdapter,
  FallbackConfig,
  GeminiSearchProvider,
  SearchRequest,
  SearchResponse,
  SmartSearchLogger,
  AuditLogFields,
} from './types.js';

export interface SmartSearchRuntimeOptions {
  config?: Partial<FallbackConfig>;
  geminiProvider: GeminiSearchProvider;
  ddgAdapter?: DdgSearchAdapter;
  logger?: SmartSearchLogger;
  now?: () => number;
}

export function createSmartSearchRuntime(options: SmartSearchRuntimeOptions) {
  const config = resolveConfig(options.config);
  const logger = options.logger ?? createConsoleLogger();
  const ddgAdapter = options.ddgAdapter ?? new DdgAdapter({ providerEntry: config.ddgProviderEntry, now: options.now });
  const manager = new FallbackManager({
    config,
    geminiProvider: options.geminiProvider,
    ddgAdapter,
    logger,
    now: options.now,
  });

  return {
    /**
     * 执行智能搜索 (TD-001 生产就绪版)
     */
    smartSearch(input: SearchRequest): Promise<SearchResponse> {
      return manager.executeSearch(input);
    },
  };
}

/**
 * 便捷函数：执行单次智能搜索
 */
export function smartSearch(input: SearchRequest, options: SmartSearchRuntimeOptions): Promise<SearchResponse> {
  return createSmartSearchRuntime(options).smartSearch(input);
}

function resolveConfig(config?: Partial<FallbackConfig>): FallbackConfig {
  return {
    ...DEFAULT_FALLBACK_CONFIG,
    ...config,
    healthCheck: {
      ...DEFAULT_FALLBACK_CONFIG.healthCheck,
      ...config?.healthCheck,
    },
    ddgProviderEntry: config?.ddgProviderEntry ?? process.env.DDG_PROVIDER_PATH ?? DEFAULT_FALLBACK_CONFIG.ddgProviderEntry,
  };
}

function createConsoleLogger(): SmartSearchLogger {
  return {
    info(event, fields: AuditLogFields) {
      console.info(JSON.stringify({ level: 'info', event, ...fields }));
    },
    warn(event, fields: AuditLogFields) {
      console.warn(JSON.stringify({ level: 'warn', event, ...fields }));
    },
    error(event, fields: AuditLogFields) {
      console.error(JSON.stringify({ level: 'error', event, ...fields }));
    },
  };
}

// ==================== 公共导出 ====================

export * from './types.js';
export * from './error-classifier.js';
export * from './ddg-adapter.js';
export * from './fallback-manager.js';
