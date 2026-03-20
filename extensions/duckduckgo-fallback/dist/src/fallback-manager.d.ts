import { DdgSearchAdapter, FallbackConfig, GeminiHealthStatus, GeminiSearchProvider, SmartSearchInput, SmartSearchLogger, SmartSearchResult } from './types.js';
interface FallbackManagerOptions {
    config: FallbackConfig;
    geminiProvider: GeminiSearchProvider;
    ddgAdapter: DdgSearchAdapter;
    logger: SmartSearchLogger;
    now?: () => number;
}
export declare class FallbackManager {
    private readonly config;
    private readonly geminiProvider;
    private readonly ddgAdapter;
    private readonly logger;
    private readonly now;
    constructor(options: FallbackManagerOptions);
    executeSearch(input: SmartSearchInput): Promise<SmartSearchResult>;
    private executeGemini;
    private executeDdgFallback;
    private createFatalError;
    private getCircuitOpenClassification;
    private recordGeminiFailure;
    private recordGeminiSuccess;
    private buildLog;
}
export declare function getGeminiHealthStatus(): GeminiHealthStatus;
export declare function resetGeminiHealthStatus(): void;
export {};
