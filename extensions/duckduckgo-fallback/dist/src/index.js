import { DdgAdapter } from './ddg-adapter.js';
import { FallbackManager } from './fallback-manager.js';
import { DEFAULT_FALLBACK_CONFIG, } from './types.js';
export function createSmartSearchRuntime(options) {
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
        smartSearch(input) {
            return manager.executeSearch(input);
        },
    };
}
export function smartSearch(input, options) {
    return createSmartSearchRuntime(options).smartSearch(input);
}
function resolveConfig(config) {
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
function createConsoleLogger() {
    return {
        info(event, fields) {
            console.info(JSON.stringify({ level: 'info', event, ...fields }));
        },
        warn(event, fields) {
            console.warn(JSON.stringify({ level: 'warn', event, ...fields }));
        },
        error(event, fields) {
            console.error(JSON.stringify({ level: 'error', event, ...fields }));
        },
    };
}
export * from './types.js';
export * from './error-classifier.js';
export * from './ddg-adapter.js';
export * from './fallback-manager.js';
