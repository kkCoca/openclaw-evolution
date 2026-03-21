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
        /**
         * 执行智能搜索 (TD-001 生产就绪版)
         */
        smartSearch(input) {
            return manager.executeSearch(input);
        },
    };
}
/**
 * 便捷函数：执行单次智能搜索
 */
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
// ==================== 公共导出 ====================
export * from './types.js';
export * from './error-classifier.js';
export * from './ddg-adapter.js';
export * from './fallback-manager.js';
