import { DdgSearchAdapter, FallbackConfig, GeminiSearchProvider, SearchRequest, SearchResponse, SmartSearchLogger } from './types.js';
export interface SmartSearchRuntimeOptions {
    config?: Partial<FallbackConfig>;
    geminiProvider: GeminiSearchProvider;
    ddgAdapter?: DdgSearchAdapter;
    logger?: SmartSearchLogger;
    now?: () => number;
}
export declare function createSmartSearchRuntime(options: SmartSearchRuntimeOptions): {
    /**
     * 执行智能搜索 (TD-001 生产就绪版)
     */
    smartSearch(input: SearchRequest): Promise<SearchResponse>;
};
/**
 * 便捷函数：执行单次智能搜索
 */
export declare function smartSearch(input: SearchRequest, options: SmartSearchRuntimeOptions): Promise<SearchResponse>;
export * from './types.js';
export * from './error-classifier.js';
export * from './ddg-adapter.js';
export * from './fallback-manager.js';
