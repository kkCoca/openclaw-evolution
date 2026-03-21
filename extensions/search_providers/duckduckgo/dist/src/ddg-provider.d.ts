import { type DuckDuckGoSearchProviderOptions, type DuckDuckGoSearchRequest, type DuckDuckGoSearchResponse, type WebSearchInput } from './types.js';
export declare class DuckDuckGoSearchProvider {
    private readonly client;
    private readonly parser;
    private readonly cache;
    private readonly rateLimiter;
    private readonly now;
    constructor(options?: DuckDuckGoSearchProviderOptions);
    normalizeRequest(input: WebSearchInput): DuckDuckGoSearchRequest;
    buildCacheKey(request: Pick<DuckDuckGoSearchRequest, 'query' | 'country' | 'language'>): string;
    search(input: WebSearchInput): Promise<DuckDuckGoSearchResponse>;
    private toProviderError;
}
