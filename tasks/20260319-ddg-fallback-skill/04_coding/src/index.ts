import { DdgAdapter } from './ddg-adapter.js';
import { FallbackManager } from './fallback-manager.js';
import {
  DEFAULT_FALLBACK_CONFIG,
  DdgSearchAdapter,
  FallbackConfig,
  GeminiSearchProvider,
  SmartSearchInput,
  SmartSearchLogger,
  SmartSearchResult,
  StructuredLogFields,
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
    smartSearch(input: SmartSearchInput): Promise<SmartSearchResult> {
      return manager.executeSearch(input);
    },
  };
}

export function smartSearch(input: SmartSearchInput, options: SmartSearchRuntimeOptions): Promise<SmartSearchResult> {
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
    info(event: string, fields: StructuredLogFields) {
      console.info(JSON.stringify({ level: 'info', event, ...fields }));
    },
    warn(event: string, fields: StructuredLogFields) {
      console.warn(JSON.stringify({ level: 'warn', event, ...fields }));
    },
    error(event: string, fields: StructuredLogFields) {
      console.error(JSON.stringify({ level: 'error', event, ...fields }));
    },
  };
}

export * from './types.js';
export * from './error-classifier.js';
export * from './ddg-adapter.js';
export * from './fallback-manager.js';
