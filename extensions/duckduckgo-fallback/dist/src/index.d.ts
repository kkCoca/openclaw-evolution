import { DdgSearchAdapter, FallbackConfig, GeminiSearchProvider, SmartSearchInput, SmartSearchLogger, SmartSearchResult } from './types.js';
export interface SmartSearchRuntimeOptions {
    config?: Partial<FallbackConfig>;
    geminiProvider: GeminiSearchProvider;
    ddgAdapter?: DdgSearchAdapter;
    logger?: SmartSearchLogger;
    now?: () => number;
}
export declare function createSmartSearchRuntime(options: SmartSearchRuntimeOptions): {
    smartSearch(input: SmartSearchInput): Promise<SmartSearchResult>;
};
export declare function smartSearch(input: SmartSearchInput, options: SmartSearchRuntimeOptions): Promise<SmartSearchResult>;
export * from './types.js';
export * from './error-classifier.js';
export * from './ddg-adapter.js';
export * from './fallback-manager.js';
